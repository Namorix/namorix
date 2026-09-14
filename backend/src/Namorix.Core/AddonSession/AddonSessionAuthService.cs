using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Grpc.Core;
using Microsoft.Extensions.Options;
using Namorix.Core.Constants;
using Namorix.Core.Grpc;
using Namorix.Core.OAuth;
using Namorix.Core.Protos;

namespace Namorix.Core.AddonSession;

// What the browser gets after a successful login: the grant row (so the addon can refresh
// later) and the access JWT that goes into the cookie.
public sealed record AddonLoginResult(AddonToken Token, string AccessToken);

public sealed class AddonSessionAuthService(
    AddonChannelClient channel,
    NmxOAuth2Client oauth,
    NmxAddonConfig config,
    IAddonTokenStore tokens,
    AddonSessionLockRegistry refreshLocks,
    IMemoryCache cache,
    IOptions<AddonSessionAuthOptions> options,
    ILogger<AddonSessionAuthService> logger)
{
    private const string StatePrefix = "nmx:oauth:state:";

    public async Task<string> BuildLoginUrlAsync(HttpRequest request, CancellationToken ct)
    {
        await oauth.CreateClientAssertionAsync(ct);

        var state = Guid.NewGuid().ToString("N");

        // PKCE: the addon is a confidential client, but the authorization code still travels
        // back through the browser, so it is bound to a secret only this backend ever sees.
        // The verifier rides in the state entry — the state is what ties the callback to the
        // login that started it.
        var codeVerifier = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        cache.Set(StatePrefix + state, codeVerifier,
            TimeSpan.FromMinutes(options.Value.StateTtlMinutes));

        // Behind the desktop's frontgate the addon is addressed by its internal address; the
        // origin the browser actually used arrives in the forwarded headers.
        var scheme = request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? request.Scheme;
        var host = request.Headers["X-Forwarded-Host"].FirstOrDefault() ?? request.Host.Value;
        var redirectUri = $"{scheme}://{host}{options.Value.CallbackPath}";
        var desktopApiUrl = channel.BrowserOrigin ?? config.DesktopApiUrl;
        var query = new Dictionary<string, string?>
        {
            ["response_type"] = "code",
            ["client_id"] = oauth.ClientId,
            ["redirect_uri"] = redirectUri,
            ["state"] = state,
            ["code_challenge"] = Base64UrlEncode(
                SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier))),
            ["code_challenge_method"] = "S256",
        };

        return QueryHelpers.AddQueryString(
            $"{desktopApiUrl}{OAuthEndpoints.Authorize}", query);
    }

    public async Task<AddonLoginResult> CompleteLoginAsync(
        string code, string state, CancellationToken ct)
    {
        if (!cache.TryGetValue(StatePrefix + state, out string? codeVerifier)
            || codeVerifier is null)
            throw new OAuthCallbackException(OAuthErrors.InvalidRequest,
                "OAuth state mismatch or login flow expired");
        cache.Remove(StatePrefix + state);

        await oauth.CreateClientAssertionAsync(ct);

        OAuthTokenResult result;
        try
        {
            result = await channel.ExchangeUserCodeAsync(code, oauth.ClientId!, codeVerifier, ct);
        }
        catch (RpcException ex) when (ex.StatusCode is StatusCode.InvalidArgument
            or StatusCode.Unauthenticated or StatusCode.PermissionDenied)
        {
            // Desktop rejects the code (invalid/expired) or the addon's machine token/client_id is wrong.
            // Surface as an OAuth callback error so Callback returns a clean 400 with the right code.
            throw new OAuthCallbackException(OAuthErrors.InvalidGrant,
                "Invalid or expired authorization code", ex);
        }

        logger.LogInformation("User {UserId} logged in via desktop OAuth", result.UserId);

        var token = await tokens.CreateAsync(
            (int)result.UserId, oauth.ClientId!, result.RefreshToken, ct);

        // DG9: the addon serves one user at a time. A second user must not be able to take
        // over the stored grant, because the data behind it is not yet partitioned per user.
        if (token is null)
        {
            logger.LogWarning(
                "Refused login for user {UserId}: addon is already granted to another user",
                result.UserId);
            throw new OAuthCallbackException(OAuthErrors.AccessDenied,
                "This addon is already logged in as another user");
        }

        return new AddonLoginResult(token, result.AccessToken);
    }

    // Returns the new access JWT once the rotated refresh token is safely persisted, or
    // null when the grant no longer exists (revoked by the desktop while we held it).
    public async Task<string?> RefreshAsync(int userId, string clientId, CancellationToken ct)
    {
        await using var lease = await refreshLocks.AcquireAsync($"{clientId}:{userId}", ct);

        // Both the read and the network call stay inside the lock. Rotation makes the
        // refresh token single-use: a second request that read it before we replaced it
        // would present a consumed token, which the desktop reads as theft and answers by
        // revoking the whole chain — a lost session, not just a wasted round trip.
        var token = await tokens.FindAsync(userId, clientId, ct);
        if (token is null || token.RefreshTokenExpiresAt <= DateTime.UtcNow)
            return null;

        var refreshToken = tokens.DecryptRefreshToken(token);
        if (string.IsNullOrEmpty(refreshToken))
        {
            logger.LogError("Stored grant for user {UserId} has an unreadable refresh token", userId);
            return null;
        }

        await oauth.CreateClientAssertionAsync(ct);
        var result = await channel.RefreshUserTokenAsync(refreshToken, clientId, ct);

        // Persist before returning: the desktop has already rotated, so a crash between its
        // response and this write would leave the consumed token as our only credential, and
        // the next refresh would read as theft.
        await tokens.UpdateRefreshTokenAsync(token, result.RefreshToken, ct);

        return result.AccessToken;
    }

    // Logout, addon side. Takes the same lease as refresh: a refresh already past the lock
    // would otherwise land its rotated row on the desktop after our revoke, leaving a live
    // grant behind a logout the user was told had succeeded.
    // False means the desktop could not be reached or refused, so the grant is still alive
    // there and reporting a clean logout would be a lie.
    public async Task<bool> RevokeAsync(int userId, string clientId, CancellationToken ct)
    {
        await using var lease = await refreshLocks.AcquireAsync($"{clientId}:{userId}", ct);

        try
        {
            await channel.RevokeGrantAsync(userId, ct);
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not revoke the grant for user {UserId} on the desktop", userId);
            return false;
        }
    }

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
