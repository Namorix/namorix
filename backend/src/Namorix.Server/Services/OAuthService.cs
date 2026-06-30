using Microsoft.EntityFrameworkCore;
using Namorix.Core.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class OAuthService(AppDbContext db)
{
    public async Task<string?> ValidateAuthorizationAsync(string clientId, string redirectUri)
    {
        var addon = await db.AddonInstallations.FirstOrDefaultAsync(a => a.ClientId == clientId);
        if (addon?.RedirectUri != redirectUri)
            return null;
        return addon.Id;
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

    public async Task RevokeTokenAsync(string tokenId)
    {
        var token = await db.OAuthTokens.FirstOrDefaultAsync(t => t.TokenId == tokenId);
        if (token is not null)
        {
            token.Revoked = true;
            await db.SaveChangesAsync();
        }
    }

    private static bool VerifyClientAssertion(string assertion, string publicKeyPem, string expectedClientId)
    {
        // TODO: Implement JWT verification with RSA public key
        // For now, stub implementation
        return true;
    }
}