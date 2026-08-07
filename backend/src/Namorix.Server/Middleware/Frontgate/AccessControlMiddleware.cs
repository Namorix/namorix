using Namorix.Server.Models.Frontgate;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class AccessControlMiddleware(RequestDelegate next,
    FrontgateProxyConfigProvider proxyProvider, FrontgateAccessService accessService)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(AcmeChallengeMiddleware.ChallengePrefix))
        {
            await next(context);
            return;
        }
        
        var host = context.Request.Host.Host;
        if (!proxyProvider.AccessSources.TryGetValue(host, out var entry))
        {
            await next(context);
            return;
        }
        
        var clientIp = context.Connection.RemoteIpAddress!;
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (accessService.Evaluate(entry.Mode, entry.Policy, clientIp, authHeader) == AccessDecision.Deny)
        {
            if (entry.Mode == ProxyAccessMode.BasicAuth)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.Headers.WWWAuthenticate = $"Basic realm=\"{host}\", charset=\"UTF-8\"";
            }
            else
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
            }
            return;
        }
        
        await next(context);
    }
}
