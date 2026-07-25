using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Namorix.Core.Models;
using Namorix.Core.Utils;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class OAuthService(AppDbContext db, IMemoryCache memoryCache)
{
    public async Task<string?> ValidateAuthorizationAsync(string clientId, string redirectUri)
    {
        var addon = await db.AddonInstallations.FirstOrDefaultAsync(a => a.ClientId == clientId);
        return addon?.PublicKey != null ? addon.Id : null;
    }

    public async Task<OAuthAuthorizationCode> CreateAuthorizationCodeAsync(
        string clientId, int userId, string? scope, string redirectUri,
        string? codeChallenge = null, string? codeChallengeMethod = null)
    {
        var code = new OAuthAuthorizationCode
        {
            Code = Guid.NewGuid().ToString("N"),
            ClientId = clientId,
            UserId = userId,
            Scope = scope,
            ExpiresAt = DateTime.UtcNow.AddMinutes(1),
            RedirectUri = redirectUri,
            CodeChallenge = codeChallenge,
            CodeChallengeMethod = codeChallengeMethod,
        };
        
        db.OAuthAuthorizationCodes.Add(code);
        await db.SaveChangesAsync();
        return code;
    }
    
    public async Task<(string TokenId, string RefreshToken)> ExchangeCodeAsync(
        string code, string clientId, string? clientAssertion, string? codeVerifier)
    {
        var authCode = await db.OAuthAuthorizationCodes
            .FirstOrDefaultAsync(c => c.Code == code && c.ClientId == clientId);

        if (authCode is null || authCode.ExpiresAt < DateTime.UtcNow)
            return (null, null)!;
        
        if (!string.IsNullOrEmpty(codeVerifier))
        {
            if (string.IsNullOrEmpty(authCode.CodeChallenge) || authCode.CodeChallengeMethod != "S256")
                return (null, null)!;

            var challenge = Base64UrlEncode(SHA256.HashData(
                Encoding.UTF8.GetBytes(codeVerifier)));
            if (!string.Equals(challenge, authCode.CodeChallenge, StringComparison.Ordinal))
                return (null, null)!;
        }
        else
        {
            if (string.IsNullOrEmpty(clientAssertion))
                return (null, null)!;

            var addon = await db.AddonInstallations
                .FirstOrDefaultAsync(a => a.ClientId == clientId);
            if (addon?.PublicKey is null || !VerifyClientAssertion(clientAssertion, addon.PublicKey, clientId))
                return (null, null)!;
        }

        db.OAuthAuthorizationCodes.Remove(authCode);
        var tokenId = Guid.NewGuid().ToString("N");
        
        db.OAuthTokens.Add(new OAuthToken
        {
            TokenId = tokenId,
            ClientId = clientId,
            UserId = authCode.UserId,
            Scope = authCode.Scope,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        db.OAuthRefreshTokens.Add(new OAuthRefreshToken
        {
            ClientId = clientId,
            TokenHash = TokenHash.HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });
        
        await db.SaveChangesAsync();
        return (tokenId, refreshToken);
    }

    public async Task<(string TokenId, string RefreshToken)?> RefreshAddonTokenAsync(string refreshToken)
    {
        var hash = TokenHash.HashToken(refreshToken);
        var stored = await db.OAuthRefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == hash && !r.Used && r.ExpiresAt > DateTime.UtcNow);
        if (stored is null)
            return null;

        stored.Used = true;
        var newTokenId = Guid.NewGuid().ToString("N");

        db.OAuthTokens.Add(new OAuthToken
        {
            TokenId = newTokenId,
            ClientId = stored.ClientId,
            Scope = "default",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });

        var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        db.OAuthRefreshTokens.Add(new OAuthRefreshToken
        {
            ClientId = stored.ClientId,
            TokenHash = TokenHash.HashToken(newRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return (newTokenId, newRefreshToken);
    }
    
    public async Task<string?> RegisterClientAsync(string token, string publicKeyPem)
    {
        var reg = await db.OAuthRegistrations
            .FirstOrDefaultAsync(r => r.Token == token && !r.Used
                                                       && r.ExpiresAt > DateTime.UtcNow);
        if (reg is null)
            return null;

        var addon = await db.AddonInstallations.FindAsync([reg.AddonInstallationId]);
        if (addon is null)
            return null;

        var clientId = Guid.NewGuid().ToString("N");
        addon.ClientId = clientId;
        addon.PublicKey = publicKeyPem;
        reg.Used = true;
        await db.SaveChangesAsync();
        return clientId;
    }
    
    public async Task<string?> RevokeTokenAsync(string tokenId, string? tokenTypeHint)
    {
        var token = await db.OAuthTokens.FindAsync(tokenId);
        if (token == null)
            return null;

        token.Revoked = true;
        await db.SaveChangesAsync();
        
        // Find addonId by clientId to cancel gRPC stream
        var addon = await db.AddonInstallations
            .FirstOrDefaultAsync(a => a.ClientId == token.ClientId);
        
        return addon?.Id;
    }
    
    public async Task<string?> IssueClientCredentialsTokenAsync(string clientAssertion)
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(clientAssertion);
        var clientId = jwt.Issuer;
        
        var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        if (string.IsNullOrEmpty(jti))
            return null;
    
        var addon = await db.AddonInstallations
            .FirstOrDefaultAsync(a => a.ClientId == clientId && a.PublicKey != null);
        if (addon?.PublicKey is null)
            return null;
    
        if (!VerifyClientAssertion(clientAssertion, addon.PublicKey, clientId))
            return null;
    
        var cacheKey = $"oauth:jti:{jti}";
        if (memoryCache.Get<bool?>(cacheKey) == true)
            return null;
        memoryCache.Set(cacheKey, true, TimeSpan.FromMinutes(5));
        
        var token = new OAuthToken
        {
            TokenId = Guid.NewGuid().ToString("N"),
            ClientId = clientId,
            Scope = addon.Scope ?? "default",
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        };
        db.OAuthTokens.Add(token);
        await db.SaveChangesAsync();
        return token.TokenId;
    }

    public async Task<bool> IsAddonAuthorizedAsync(string addonId)
    {
        return await db.AddonInstallations
            .AsNoTracking()
            .AnyAsync(a => a.Id == addonId 
                           && a.ClientId != null && a.Status != null);
    }
    
    public async Task<string?> ValidateTokenAsync(string tokenId)
    {
        var token = await db.OAuthTokens.FindAsync(tokenId);
        if (token == null || token.ExpiresAt < DateTime.UtcNow || token.Revoked)
            return null;
        
        var addon = await db.AddonInstallations
            .FirstOrDefaultAsync(a => a.ClientId == token.ClientId);
        return addon?.Id;
    }
    
    private static bool VerifyClientAssertion(
        string assertion, string publicKeyPem, string expectedClientId)
    {
        try
        {
            using var rsa = RSA.Create();
            rsa.ImportFromPem(publicKeyPem);

            var securityKey = new RsaSecurityKey(rsa)
            {
                CryptoProviderFactory = new CryptoProviderFactory
                {
                    CacheSignatureProviders = false
                }
            };
            

            new JwtSecurityTokenHandler().ValidateToken(assertion,
                new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = expectedClientId,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = securityKey,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                }, out _);
            return true;
        }
        catch
        {
            return false;
        }
    }
    
    private static string Base64UrlEncode(byte[] data)
    {
        return Convert.ToBase64String(data)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}