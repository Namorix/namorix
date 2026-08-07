using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class BlockWebSocketMiddleware(RequestDelegate next, FrontgateProxyConfigProvider proxyConfig)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var isWebSocket = string.Equals(context.Request.Headers.Upgrade, "websocket", 
            StringComparison.OrdinalIgnoreCase);

        if (isWebSocket && !proxyConfig.WebSocketSources.ContainsKey(context.Request.Host.Host))
        {
            context.Response.StatusCode = StatusCodes.Status426UpgradeRequired;
            return;
        }

        await next(context);
    }
}
