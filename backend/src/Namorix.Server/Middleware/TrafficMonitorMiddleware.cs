using Namorix.Adapters.Persistence;
using Namorix.Core.Infrastructure;
using Namorix.Core.Models;

namespace Namorix.Server.Middleware;

public class TrafficMonitorMiddleware(RequestDelegate requestDelegate)
{
    private static readonly HashSet<(string Method, string Path)> Registry = [];
    private static readonly object Lock = new();
    private static bool _loaded;

    public async Task InvokeAsync(HttpContext httpContext, AppDbContext appDbContext)
    {
        if (!_loaded)
        {
            lock (Lock)
            {
                if (!_loaded)
                {
                    var endpoints = appDbContext.TrafficEndpoints
                        .Where(e => e.IsEnabled)
                        .Select(e => new { e.Method, e.Path })
                        .ToList();

                    foreach (var e in endpoints)
                        Registry.Add((e.Method, e.Path));
                    _loaded = true;
                }
            }
        }

        var start = DateTime.UtcNow;
        await requestDelegate(httpContext);
        var durationMs = (DateTime.UtcNow - start).TotalMilliseconds;
        
        if (!Registry.Contains((httpContext.Request.Method, httpContext.Request.Path.Value!)))
            return;

        var log = new TrafficLog()
        {
            EndpointId = 0,
            StatusCode = httpContext.Response.StatusCode,
            DurationMs = (long)durationMs,
            ResponseSizeBytes = httpContext.Response.Headers.ContentLength ?? 0,
            TrafficAddressId = null,
            UserId = null
        };

        TrafficBuffer.Logs.Writer.TryWrite(log);
    }

    public static void AddToRegistry(string method, string path)
    {
        lock (Lock) Registry.Add((method, path));
    }

    public static void RemoveFromRegistry(string method, string path)
    {
        lock (Lock) Registry.Remove((method, path));
    }
}