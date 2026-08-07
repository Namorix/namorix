using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class HstsMiddleware(RequestDelegate next, FrontgateProxyConfigProvider proxyConfig)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (proxyConfig.HstsSources.ContainsKey(context.Request.Host.Host))
        {
            var includeSubdomains = proxyConfig.HstsSubdomainSources.ContainsKey(context.Request.Host.Host);
            context.Response.Headers.StrictTransportSecurity = 
                $"max-age=31536000{(includeSubdomains ? "; includeSubDomains" : "")}";
        }
        await next(context);
    }
}
