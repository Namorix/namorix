using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Namorix.Core.Constants;
using Namorix.Core.Grpc;

namespace Namorix.Core.AddonSession;

// null means the token is not authentic: unparsable, wrong issuer, or signed by a key the
// desktop does not publish. Expiry is reported rather than enforced — the middleware has to
// recognize an authentic-but-expired token precisely so it can refresh it instead of
// answering 401.
public sealed record AddonTokenValidation(int UserId, string ClientId, string SessionId,
    DateTime ExpiresAt)
{
    public bool IsExpired => ExpiresAt <= DateTime.UtcNow;
}

// Verifies addon access tokens locally, so the addon stops asking the desktop on every
// request — but only while the channel proves the desktop is alive. Keys are held in RAM
// and nowhere else (DG1): an addon that cannot reach the desktop must not be able to
// verify anything, and a disk cache would let it keep serving through a dead channel.
public sealed class NmxAddonTokenValidator(
    AddonChannelClient channel,
    ILogger<NmxAddonTokenValidator> logger)
{
    private const string ClaimSub = "sub";

    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly Dictionary<string, SecurityKey> _keys = new(StringComparer.Ordinal);

    public async Task<AddonTokenValidation?> ValidateAsync(string token, CancellationToken ct)
    {
        JwtSecurityToken jwt;
        try
        {
            jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        }
        catch (Exception ex) when (ex is ArgumentException or SecurityTokenException)
        {
            return null;
        }

        var kid = jwt.Header.Kid;
        if (string.IsNullOrEmpty(kid))
            return null;

        var key = await ResolveKeyAsync(kid, ct);
        if (key is null || !SignatureIsValid(token, key))
            return null;

        var clientId = jwt.Claims
            .FirstOrDefault(c => c.Type == Constants.OAuth.AddonToken.ClientIdClaim)?.Value;
        var sessionId = jwt.Claims
            .FirstOrDefault(c => c.Type == Constants.OAuth.AddonToken.SessionIdClaim)?.Value;
        if (!int.TryParse(jwt.Claims.FirstOrDefault(c => c.Type == ClaimSub)?.Value, out var userId)
            || userId <= 0
            || string.IsNullOrEmpty(clientId)
            // A token without a session names no row to look up. It can only be one issued
            // before sessions existed, whose grant is gone from the store anyway.
            || string.IsNullOrEmpty(sessionId)
            || jwt.ValidTo == DateTime.MinValue)
            return null;

        return new AddonTokenValidation(userId, clientId, sessionId, jwt.ValidTo);
    }

    private async Task<SecurityKey?> ResolveKeyAsync(string kid, CancellationToken ct)
    {
        await _gate.WaitAsync(ct);
        try
        {
            if (_keys.TryGetValue(kid, out var cached))
                return cached;

            // Unknown kid: either a key rotation we have not seen, or a token from someone
            // else. Refetch once so rotation is picked up without an addon restart.
            await RefreshKeysAsync(ct);
            return _keys.GetValueOrDefault(kid);
        }
        catch (Exception ex)
        {
            // A dead channel must not turn into an exception per request; the middleware
            // already refuses to serve in that state. Treat it as "cannot verify".
            logger.LogWarning(ex, "Could not fetch addon signing keys from the desktop");
            return null;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task RefreshKeysAsync(CancellationToken ct)
    {
        var response = await channel.GetJwksAsync(ct);

        // Replaced wholesale rather than merged: a key the desktop stopped publishing must
        // stop verifying here too, otherwise a retired key keeps working forever.
        _keys.Clear();
        foreach (var key in response.Keys)
        {
            if (string.IsNullOrEmpty(key.Kid) || string.IsNullOrEmpty(key.PublicKeyPem))
                continue;

            try
            {
                var rsa = RSA.Create();
                rsa.ImportFromPem(key.PublicKeyPem);
                _keys[key.Kid] = new RsaSecurityKey(rsa) { KeyId = key.Kid };
            }
            catch (CryptographicException ex)
            {
                logger.LogWarning(ex, "Ignoring unreadable signing key kid={Kid}", key.Kid);
            }
        }
    }

    private static bool SignatureIsValid(string token, SecurityKey key)
    {
        try
        {
            new JwtSecurityTokenHandler().ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = Constants.OAuth.AddonToken.Issuer,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                // Expiry is the caller's business — see the type comment.
                ValidateLifetime = false,
                ValidateActor = false,
                ValidateTokenReplay = false,
            }, out _);
            return true;
        }
        catch (Exception ex) when (ex is SecurityTokenException or ArgumentException)
        {
            return false;
        }
    }
}
