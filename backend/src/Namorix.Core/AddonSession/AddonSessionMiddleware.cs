using System.Security.Claims;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Namorix.Core.Constants;
using Namorix.Core.Grpc;

namespace Namorix.Core.AddonSession;

// Reads the addon's HttpOnly cookie, which now carries the access JWT itself instead of a
// session id. The addon verifies it locally against the desktop's public key — but only
// after proving the desktop is reachable, because an offline addon has no business
// authenticating anyone.
public sealed class AddonSessionMiddleware(
    RequestDelegate next,
    AddonChannelClient channel,
    IAddonTokenStore tokens,
    NmxAddonTokenValidator validator,
    AddonSessionAuthService oauth,
    IOptions<AddonSessionAuthOptions> options,
    ILogger<AddonSessionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var opts = options.Value;

        // DG1 gate, first and unconditional: the desktop is the only auth server, so an
        // addon that cannot prove it is reachable must not serve. Checked before the cookie
        // is even read, so a channel-dead addon never verifies anything — and being one
        // flag test, it costs nothing per request.
        if (!channel.IsConnected)
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            return;
        }

        if (!context.Request.Cookies.TryGetValue(opts.CookieName, out var rawToken)
            || string.IsNullOrEmpty(rawToken))
        {
            await next(context);
            return;
        }

        var ct = context.RequestAborted;
        var validation = await validator.ValidateAsync(rawToken, ct);
        if (validation is null)
        {
            // Not authentic. Stay anonymous and let [RequireAuth] decide what a 401 looks
            // like; clearing the cookie here would hide a misconfigured key from the logs.
            await next(context);
            return;
        }

        var grant = await tokens.FindAsync(validation.UserId, validation.ClientId,
            validation.SessionId, ct);
        if (grant is null || grant.RefreshTokenExpiresAt <= DateTime.UtcNow)
        {
            // The desktop revoked this session, or its refresh credential ran out. Nothing
            // can be refreshed from here, so drop the cookie instead of leaving the browser
            // presenting a token that can never work again.
            if (grant is not null)
                await tokens.DeleteAsync(validation.UserId, validation.ClientId,
                    validation.SessionId, ct);

            ClearCookie(context, opts);
            await next(context);
            return;
        }

        if (validation.IsExpired)
        {
            string? refreshed;
            try
            {
                refreshed = await oauth.RefreshAsync(validation.UserId, validation.ClientId,
                    validation.SessionId, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex) when (IsFatalRefreshFailure(ex))
            {
                logger.LogWarning(ex,
                    "Desktop rejected the grant for user {UserId}; dropping it", validation.UserId);
                await tokens.DeleteAsync(validation.UserId, validation.ClientId,
                    validation.SessionId, CancellationToken.None);
                ClearCookie(context, opts);
                await next(context);
                return;
            }
            catch (Exception ex)
            {
                // Only an explicit fatal code means the grant is dead. Anything else
                // (desktop restarting, channel not started, timeout) is transient — 503
                // asks the browser to retry, where 401 would log the user out over a
                // recoverable failure.
                logger.LogWarning(ex,
                    "Transient refresh failure for user {UserId}", validation.UserId);
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                return;
            }

            if (refreshed is null)
            {
                // The grant disappeared between our lookup and the desktop call — a revoke
                // landed in that gap. Nothing left to serve.
                ClearCookie(context, opts);
                await next(context);
                return;
            }

            SetCookie(context, opts, refreshed);
        }

        context.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, validation.UserId.ToString()),
            new Claim(ClaimTypes.Name, validation.UserId.ToString()),
            new Claim(Constants.OAuth.AddonToken.ClientIdClaim, validation.ClientId),
            new Claim(Constants.OAuth.AddonToken.SessionIdClaim, validation.SessionId),
        ], opts.AuthenticationScheme));

        await next(context);
    }

    private static void SetCookie(HttpContext context, AddonSessionAuthOptions opts, string token) =>
        context.Response.Cookies.Append(opts.CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            // The cookie has to outlive the JWT inside it. When that JWT expires the
            // middleware refreshes from the stored refresh token; if the cookie had died
            // with the JWT there would be nothing left to refresh from.
            MaxAge = TimeSpan.FromMinutes(opts.SessionTtlMinutes),
        });

    private static void ClearCookie(HttpContext context, AddonSessionAuthOptions opts) =>
        context.Response.Cookies.Delete(opts.CookieName, new CookieOptions { Path = "/" });

    private static bool IsFatalRefreshFailure(Exception ex)
        => ex is RpcException rpc
           && rpc.Trailers.GetValue(Constants.OAuth.Trailer.ErrorCode)
               // invalid_client means the desktop no longer knows this ClientId, so the
               // cookie can never be refreshed again. Treating it as transient 503s forever
               // and leaves the user clearing cookies by hand.
               is OAuthErrors.TheftDetected or OAuthErrors.InvalidGrant or OAuthErrors.InvalidClient;
}
