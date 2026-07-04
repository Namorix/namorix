using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Namorix.Core.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class OAuthService(AppDbContext db, IMemoryCache memoryCache)
{
    public async Task<string?> ValidateAuthorizationAsync(string clientId, string redirectUri)
    {
        var addon = await db.AddonInstallations.FirstOrDefaultAsync(a => a.ClientId == clientId);
        return addon?.RedirectUri != redirectUri ? null : addon.Id;
    }

    public async Task<OAuthAuthorizationCode> CreateAuthorizationCodeAsync(
        string clientId, int userId, string? scope, string redirectUri)
    {
        var code = new OAuthAuthorizationCode
        {
            Code = Guid.NewGuid().ToString("N"),
            ClientId = clientId,
            UserId = userId,
            Scope = scope,
            ExpiresAt = DateTime.UtcNow.AddMinutes(1),
            RedirectUri = redirectUri,
        };
        db.OAuthAuthorizationCodes.Add(code);
        await db.SaveChangesAsync();
        return code;
    }

    public async Task<string?> ExchangeCodeAsync(string code, string clientId, string clientAssertion)
    {
        var authCode = await db.OAuthAuthorizationCodes
            .FirstOrDefaultAsync(c => c.Code == code && c.ClientId == clientId);

        if (authCode is null || authCode.ExpiresAt < DateTime.UtcNow)
            return null;

        // Verify client_assertion (JWT signed by addon's private key)
        var addon = await db.AddonInstallations.FirstOrDefaultAsync(a => a.ClientId == clientId);
        if (addon?.PublicKey is null)
            return null;

        if (!VerifyClientAssertion(clientAssertion, addon.PublicKey, clientId))
            return null;

        // Delete used code
        db.OAuthAuthorizationCodes.Remove(authCode);

        // Create access token
        var token = new OAuthToken
        {
            TokenId = Guid.NewGuid().ToString("N"),
            ClientId = clientId,
            UserId = authCode.UserId,
            Scope = authCode.Scope,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        };
        db.OAuthTokens.Add(token);
        await db.SaveChangesAsync();

        return token.TokenId;
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
        // Chỉ check DB nhanh, không verify JWT
        // TODO
        var addon = await db.AddonInstallations.FindAsync(addonId);
        return addon is
        {
            ClientId: not null,
            Status: not null
        };
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
            new JwtSecurityTokenHandler().ValidateToken(assertion,
                new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = expectedClientId,
                    ValidateAudience = false,  // TODO: validate khi có request context
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new RsaSecurityKey(rsa),
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
}