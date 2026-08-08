using System.Collections.Concurrent;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class RateLimitMiddleware(RequestDelegate next, FrontgateProxyConfigProvider proxyConfig)
{
    private sealed record RateWindow(DateTime Start, int Count);
    private static readonly ConcurrentDictionary<string, RateWindow> Windows = new();

    public async Task InvokeAsync(HttpContext context)
    {
        if (proxyConfig.RateLimitSources.TryGetValue(context.Request.Host.Host, out var cfg))
        {
            var key = $"{context.Request.Host.Host}|{context.Connection.RemoteIpAddress}";
            var now = DateTime.UtcNow;

            Windows.AddOrUpdate(key,
                _ => new RateWindow(now, 1),
                (_, w) => (now - w.Start).TotalSeconds >= cfg.WindowSec
                    ? new RateWindow(now, 1)
                    : new RateWindow(w.Start, w.Count + 1));

            if (Windows[key].Count > cfg.Limit)
            {
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                return;
            }
        }
        await next(context);
    }
}