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

public sealed class AddonSessionAuthService(
    AddonChannelClient channel,
    NmxOAuth2Client oauth,
    NmxAddonConfig config,
    IAddonSessionService sessions,
    IMemoryCache cache,
    IOptions<AddonSessionAuthOptions> options,
    ILogger<AddonSessionAuthService> logger)
{
    private const string StatePrefix = "nmx:oauth:state:";

    public async Task<string> BuildLoginUrlAsync(HttpRequest request, CancellationToken ct)
    {
        await oauth.CreateClientAssertionAsync(ct);

        var state = Guid.NewGuid().ToString("N");
        cache.Set(StatePrefix + state, true, TimeSpan.FromMinutes(options.Value.StateTtlMinutes));

        var redirectUri = $"{request.Scheme}://{request.Host}{options.Value.CallbackPath}";
        var query = new Dictionary<string, string?>
        {
            ["response_type"] = "code",
            ["client_id"] = oauth.ClientId,
            ["redirect_uri"] = redirectUri,
            ["state"] = state,
        };

        return QueryHelpers.AddQueryString(
            $"{config.DesktopApiUrl}{OAuthEndpoints.Authorize}", query);
    }

    public async Task<AddonSession> CompleteLoginAsync(
        string code, string state, CancellationToken ct)
    {
        if (!cache.TryGetValue(StatePrefix + state, out _))
            throw new OAuthCallbackException(OAuthErrors.InvalidRequest,
                "OAuth state mismatch or login flow expired");
        cache.Remove(StatePrefix + state);

        await oauth.CreateClientAssertionAsync(ct);

        OAuthTokenResult result;
        try
        {
            result = await channel.ExchangeUserCodeAsync(code, oauth.ClientId!, ct);
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

        return await sessions.CreateAsync(
            (int)result.UserId, oauth.ClientId!,
            result.AccessToken, result.RefreshToken, (int)result.ExpiresIn, ct);
    }

    public async Task RefreshSessionAsync(AddonSession session, CancellationToken ct)
    {
        var refreshToken = sessions.DecryptRefreshToken(session);
        if (string.IsNullOrEmpty(refreshToken))
            throw new InvalidOperationException("Session has no refresh token.");

        await oauth.CreateClientAssertionAsync(ct);
        var result = await channel.RefreshUserTokenAsync(refreshToken, session.ClientId, ct);

        await sessions.UpdateTokensAsync(session,
            result.AccessToken, result.RefreshToken, (int)result.ExpiresIn, ct);
    }
}
