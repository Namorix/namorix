using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Namorix.Core.AddonSession;
using Namorix.Core.Constants;
using Namorix.Core.Models;
using Namorix.Core.Utils;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public enum OAuthRefreshStatus { Ok, Expired, Reused }

// Who a revoked grant belonged to. The push that tells an addon its session died is
// routed by ClientId and read by UserId, so both have to survive the revoke call.
public sealed record OAuthRevokedGrant(string AddonId, string ClientId, int UserId);

public class OAuthService(AppDbContext db, IMemoryCache memoryCache, ILogger<OAuthService> logger,
    NmxAddonTokenSigner signer, IDataProtectionProvider dataProtection)
{
    // One source for the addon access token lifetime. The JWT `exp`, the OAuthTokens
    // row and every expires_in handed back to the addon all derive from this, so they
    // cannot drift apart. The client_credentials machine token keeps its own TTL.
    private static readonly TimeSpan AccessTokenTtl =
        TimeSpan.FromSeconds(OAuth.AddonToken.AccessTokenTtlSeconds);

    private static readonly TimeSpan RefreshReuseGrace =
        TimeSpan.FromSeconds(OAuth.AddonToken.RefreshReuseGraceSeconds);

    private readonly IDataProtector _refreshTokenProtector =
        dataProtection.CreateProtector("OAuth.AddonRefreshToken");

    public async Task<string?> ValidateAuthorizationAsync(string clientId, string redirectUri)
    {
        // The code is about to be sent to whatever address this says, so it is vetted before
        // the client is looked up. Only the shape can be checked here: frontgate assigns the
        // addon's host, so the desktop has no way to know the exact origin in advance. That
        // rules out malformed and non-web schemes (javascript:, data:) but not a well-formed
        // address pointing somewhere else — PKCE and the client assertion are what actually
        // stop a redirected code from being redeemed.
        if (!IsAcceptableRedirectUri(redirectUri))
            return null;

        var addon = await db.AddonInstallations.FirstOrDefaultAsync(a => a.ClientId == clientId);
        return addon?.PublicKey != null ? addon.Id : null;
    }

    private static bool IsAcceptableRedirectUri(string redirectUri)
    {
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out var uri))
            return false;

        // A fragment would be dropped by the browser before it reaches the addon, taking any
        // query the desktop appended with it.
        return (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
               && string.IsNullOrEmpty(uri.Fragment)
               && uri.AbsolutePath == OAuth.AddonToken.CallbackPath;
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
    
    public async Task<(string TokenId, string RefreshToken, int UserId, string SessionId)>
        ExchangeCodeAsync(
        string code, string clientId, string? clientAssertion, string? codeVerifier)
    {
        var authCode = await db.OAuthAuthorizationCodes
            .FirstOrDefaultAsync(c => c.Code == code && c.ClientId == clientId);

        if (authCode is null || authCode.ExpiresAt < DateTime.UtcNow)
            return (null, null, 0, null)!;

        if (!string.IsNullOrEmpty(codeVerifier))
        {
            if (string.IsNullOrEmpty(authCode.CodeChallenge) || authCode.CodeChallengeMethod != "S256")
                return (null, null, 0, null)!;

            var challenge = Base64UrlEncode(SHA256.HashData(
                Encoding.UTF8.GetBytes(codeVerifier)));
            if (!string.Equals(challenge, authCode.CodeChallenge, StringComparison.Ordinal))
                return (null, null, 0, null)!;
        }
        else
        {
            if (string.IsNullOrEmpty(clientAssertion))
                return (null, null, 0, null)!;

            var addon = await db.AddonInstallations
                .FirstOrDefaultAsync(a => a.ClientId == clientId);
            if (addon?.PublicKey is null || !VerifyClientAssertion(clientAssertion, addon.PublicKey, clientId))
                return (null, null, 0, null)!;
        }

        db.OAuthAuthorizationCodes.Remove(authCode);

        // Minted here and nowhere else: this is the one moment a chain begins, so it is the
        // only place a session identity can be created. Rotation copies it forward.
        var sessionId = Guid.NewGuid().ToString("N");
        var tokenId = signer.Sign(authCode.UserId, clientId, sessionId, AccessTokenTtl);

        db.OAuthTokens.Add(new OAuthToken
        {
            TokenId = tokenId,
            ClientId = clientId,
            UserId = authCode.UserId,
            SessionId = sessionId,
            Scope = authCode.Scope,
            ExpiresAt = DateTime.UtcNow.Add(AccessTokenTtl),
        });

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        db.OAuthRefreshTokens.Add(new OAuthRefreshToken
        {
            ClientId = clientId,
            UserId = authCode.UserId,
            SessionId = sessionId,
            TokenHash = TokenHash.HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
        return (tokenId, refreshToken, authCode.UserId, sessionId);
    }

    public async Task<(string? TokenId, string? RefreshToken, int UserId, string? SessionId,
        OAuthRefreshStatus Status)?>
        RefreshAddonTokenAsync(string refreshToken)
    {
        var hash = TokenHash.HashToken(refreshToken);
        var stored = await db.OAuthRefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == hash && r.ExpiresAt > DateTime.UtcNow);

        if (stored is null)
            return (null, null, 0, null, OAuthRefreshStatus.Expired);

        if (stored.Used)
        {
            // A retry, not an attack, if it lands inside the grace window and we still
            // hold the successor. Replaying it keeps the rotation idempotent, so a lost
            // response costs the addon nothing.
            if (TryReadSuccessor(stored) is { } successor)
                return (successor.TokenId, successor.RefreshToken, stored.UserId, stored.SessionId,
                    OAuthRefreshStatus.Ok);

            logger.LogWarning(
                "Token reuse detected for client {ClientId} user {UserId}. Revoking entire chain.",
                stored.ClientId, stored.UserId);

            await RevokeChainAsync(stored.UserId, stored.ClientId);

            return (null, null, 0, null, OAuthRefreshStatus.Reused);
        }

        stored.Used = true;
        var newTokenId = signer.Sign(stored.UserId, stored.ClientId, stored.SessionId, AccessTokenTtl);

        db.OAuthTokens.Add(new OAuthToken
        {
            TokenId = newTokenId,
            ClientId = stored.ClientId,
            UserId = stored.UserId,
            SessionId = stored.SessionId,
            Scope = "default",
            ExpiresAt = DateTime.UtcNow.Add(AccessTokenTtl),
        });

        var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        db.OAuthRefreshTokens.Add(new OAuthRefreshToken
        {
            ClientId = stored.ClientId,
            UserId = stored.UserId,
            SessionId = stored.SessionId,
            TokenHash = TokenHash.HashToken(newRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
        });

        // Recorded on the row we just consumed, and only for as long as the grace window
        // lasts. The encrypted half is never read anywhere else.
        stored.ReplacedByAccessTokenId = newTokenId;
        stored.EncryptedReplacedRefreshToken = _refreshTokenProtector.Protect(newRefreshToken);
        stored.ReplacedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return (newTokenId, newRefreshToken, stored.UserId, stored.SessionId, OAuthRefreshStatus.Ok);
    }

    private (string TokenId, string RefreshToken)? TryReadSuccessor(OAuthRefreshToken stored)
    {
        if (stored.ReplacedAt is not { } replacedAt ||
            DateTime.UtcNow - replacedAt > RefreshReuseGrace ||
            stored.ReplacedByAccessTokenId is null ||
            stored.EncryptedReplacedRefreshToken is null)
            return null;

        try
        {
            return (stored.ReplacedByAccessTokenId,
                _refreshTokenProtector.Unprotect(stored.EncryptedReplacedRefreshToken));
        }
        catch (CryptographicException)
        {
            // The key-ring no longer holds the key this value was protected with, so the
            // successor is unrecoverable. Fall through to the theft path rather than
            // fabricate a token the addon never had.
            return null;
        }
    }

    // DG6: revoke travels the whole grant, not one token. Scoped by (userId, clientId)
    // so logging one user out of one addon cannot touch their other addons.
    private async Task RevokeChainAsync(int userId, string clientId)
    {
        await db.OAuthTokens
            .Where(t => t.UserId == userId && t.ClientId == clientId && !t.Revoked)
            .ExecuteUpdateAsync(t => t.SetProperty(p => p.Revoked, true));

        await db.OAuthRefreshTokens
            .Where(r => r.UserId == userId && r.ClientId == clientId && !r.Used)
            .ExecuteUpdateAsync(r => r.SetProperty(p => p.Used, true));
    }

    // The same revoke narrowed to one session. The addon's own logout signs the user out of
    // the browser they were in, not of every session they hold on this addon.
    private async Task RevokeSessionChainAsync(int userId, string clientId, string sessionId)
    {
        await db.OAuthTokens
            .Where(t => t.UserId == userId && t.ClientId == clientId
                        && t.SessionId == sessionId && !t.Revoked)
            .ExecuteUpdateAsync(t => t.SetProperty(p => p.Revoked, true));

        await db.OAuthRefreshTokens
            .Where(r => r.UserId == userId && r.ClientId == clientId
                        && r.SessionId == sessionId && !r.Used)
            .ExecuteUpdateAsync(r => r.SetProperty(p => p.Used, true));
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

        // Only the first registration mints an identity. An addon re-registers on every
        // update, because updating rotates its registration token, and minting a fresh
        // ClientId here would strand every stored grant and live session cookie under an
        // id the desktop no longer recognises.
        if (string.IsNullOrEmpty(addon.ClientId))
            addon.ClientId = Guid.NewGuid().ToString("N");
        addon.PublicKey = publicKeyPem;
        reg.Used = true;
        await db.SaveChangesAsync();
        return addon.ClientId;
    }
    
    public async Task<OAuthRevokedGrant?> RevokeTokenAsync(string token, string? tokenTypeHint)
    {
        var preferRefresh = tokenTypeHint == OAuth.TokenTypeHint.RefreshToken;

        var revoked = preferRefresh
            ? await RevokeRefreshTokenAsync(token)
            : await RevokeAccessTokenAsync(token);

        // The hint is advisory: a client that guesses wrong still gets its token revoked,
        // and a refresh token never sits in the access table anyway.
        return revoked ?? (preferRefresh
            ? await RevokeAccessTokenAsync(token)
            : await RevokeRefreshTokenAsync(token));
    }

    private async Task<OAuthRevokedGrant?> RevokeAccessTokenAsync(string tokenId)
    {
        var token = await db.OAuthTokens.FindAsync(tokenId);
        if (token is null)
            return null;

        token.Revoked = true;

        // Killing the access token alone would let the addon refresh straight back in,
        // making the revoke meaningless. UserId == 0 marks the client_credentials machine
        // token, which holds no refresh chain — same for the pre-rotation legacy rows — so
        // there the single row is the whole grant.
        if (token.UserId != 0)
            await RevokeChainAsync(token.UserId, token.ClientId);

        await db.SaveChangesAsync();
        return await DescribeGrantAsync(token.ClientId, token.UserId);
    }

    private async Task<OAuthRevokedGrant?> RevokeRefreshTokenAsync(string rawToken)
    {
        var hash = TokenHash.HashToken(rawToken);
        var stored = await db.OAuthRefreshTokens
            .FirstOrDefaultAsync(r => r.TokenHash == hash);
        if (stored is null)
            return null;

        stored.Used = true;

        // Killing only the refresh token would leave its access token usable for the
        // rest of its TTL, which defeats the point of an explicit revoke. The grant is
        // (userId, clientId), so that is what goes.
        await RevokeChainAsync(stored.UserId, stored.ClientId);
        await db.SaveChangesAsync();

        return await DescribeGrantAsync(stored.ClientId, stored.UserId);
    }

    private async Task<OAuthRevokedGrant?> DescribeGrantAsync(string clientId, int userId)
    {
        var addon = await db.AddonInstallations
            .FirstOrDefaultAsync(a => a.ClientId == clientId);

        return addon is null ? null : new OAuthRevokedGrant(addon.Id, clientId, userId);
    }

    // DG6: the desktop session is the addon's root of trust, so ending it ends every
    // addon grant that user holds, across all clients.
    public async Task RevokeAddonTokensForUserAsync(int userId)
    {
        await db.OAuthTokens
            .Where(t => t.UserId == userId && !t.Revoked)
            .ExecuteUpdateAsync(t => t.SetProperty(p => p.Revoked, true));

        await db.OAuthRefreshTokens
            .Where(r => r.UserId == userId && !r.Used)
            .ExecuteUpdateAsync(r => r.SetProperty(p => p.Used, true));
    }

    // The addon's own logout: kills the one session (userId, clientId, sessionId) rather
    // than every session the user holds, so signing out of one browser leaves the others —
    // and the user's grants at other addons — alone. Revoking a session that is already
    // dead is a success: the caller only wants it gone.
    public Task RevokeGrantAsync(int userId, string clientId, string sessionId)
        => RevokeSessionChainAsync(userId, clientId, sessionId);

    // The sessions this addon currently holds a live grant for. Pushed to the addon whenever
    // it connects, so a revocation that happened while it was offline — and therefore
    // reached it as no push at all — is still repaired. An unconsumed refresh token inside
    // its TTL is exactly "the session still exists": rotation marks the old one used and
    // inserts a fresh one, so a revoked session has none left.
    public async Task<IReadOnlyList<AddonSessionRef>> GetActiveGrantsAsync(string clientId)
    {
        return await db.OAuthRefreshTokens
            .AsNoTracking()
            // UserId > 0 skips pre-Phase-1a rows, which were backfilled to 0 and belong to
            // no one — listing them would tell the addon a grant exists for user 0.
            .Where(r => r.ClientId == clientId && r.UserId > 0 && r.SessionId != ""
                        && !r.Used && r.ExpiresAt > DateTime.UtcNow)
            .Select(r => new AddonSessionRef(r.UserId, r.SessionId))
            .Distinct()
            .ToListAsync();
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

    public async Task<string?> GetClientIdAsync(string addonId) =>
        (await db.AddonInstallations.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == addonId))?.ClientId;
    
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