using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class ForceSslMiddleware(RequestDelegate next, FrontgateProxyConfigProvider proxyConfig)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (string.Equals(context.Request.Scheme, "http", StringComparison.OrdinalIgnoreCase)
            && proxyConfig.ForceSslSources.ContainsKey(context.Request.Host.Host))
        {
            context.Response.StatusCode = 301;
            context.Response.Headers.Location =
                $"https://{context.Request.Host}{context.Request.Path}{context.Request.QueryString}";
            return;
        }
        await next(context);
    }
}