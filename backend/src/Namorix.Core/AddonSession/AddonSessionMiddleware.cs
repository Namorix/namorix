using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
                catch (Exception ex)
                {
                    logger.LogWarning(ex,
                        "Silent refresh failed for session {SessionId}; removing session", sessionId);
                    await sessions.DeleteAsync(sessionId, context.RequestAborted);
                    session = null;
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
                new Claim("session_id", session.Id),
                new Claim("client_id", session.ClientId),
            ], opts.AuthenticationScheme);

            context.User = new ClaimsPrincipal(identity);
        }

        await next(context);
    }
}
