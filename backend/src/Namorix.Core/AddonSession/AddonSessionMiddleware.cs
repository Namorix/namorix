using System.Security.Claims;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Namorix.Core.Constants;

namespace Namorix.Core.AddonSession;

public sealed class AddonSessionMiddleware(
    RequestDelegate next,
    IAddonSessionService sessions,
    AddonSessionAuthService oauth,
    IOptions<AddonSessionAuthOptions> options,
    ILogger<AddonSessionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var opts = options.Value;
        if (!context.Request.Cookies.TryGetValue(opts.CookieName, out var sessionId))
        {
            await next(context);
            return;
        }

        var session = await sessions.FindAsync(sessionId, context.RequestAborted);

        if (session is not null && session.AccessTokenExpiresAt <= DateTime.UtcNow)
        {
            if (session.RefreshTokenExpiresAt <= DateTime.UtcNow)
            {
                await sessions.DeleteAsync(sessionId, context.RequestAborted);
                session = null;
            }
            else
            {
                try
                {
                    await oauth.RefreshSessionAsync(session, context.RequestAborted);
                }
                catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex) when (IsFatalRefreshFailure(ex))
                {
                    logger.LogWarning(ex,
                        "Session {SessionId} rejected by desktop; removing session", sessionId);
                    await sessions.DeleteAsync(sessionId, context.RequestAborted);
                    session = null;
                }
                catch (Exception ex)
                {
                    // Only an explicit fatal code means the session is dead. Anything else
                    // (desktop restarting, channel not started, timeout) is transient — keeping
                    // the session avoids logging the user out over a recoverable failure.
                    logger.LogWarning(ex,
                        "Transient refresh failure for session {SessionId}; keeping session", sessionId);
                    context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                    return;
                }
            }
        }

        if (session is not null)
        {
            var userId = session.UserId.ToString();
            var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, userId),
                new Claim(Constants.OAuth.AddonToken.SessionIdClaim, session.Id),
                new Claim(Constants.OAuth.AddonToken.ClientIdClaim, session.ClientId),
            ], opts.AuthenticationScheme);

            context.User = new ClaimsPrincipal(identity);
        }

        await next(context);
    }

    private static bool IsFatalRefreshFailure(Exception ex)
        => ex is RpcException rpc
           && rpc.Trailers.GetValue(Constants.OAuth.Trailer.ErrorCode)
               is OAuthErrors.TheftDetected or OAuthErrors.InvalidGrant;
}
