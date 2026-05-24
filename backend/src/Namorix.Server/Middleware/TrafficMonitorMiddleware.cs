using System.Diagnostics;
using System.Security.Claims;
using Namorix.Adapters.FlatFile;
using Namorix.Adapters.Infrastructure;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Middleware;

public class TrafficMonitorMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        if (httpContext.Request.Path.StartsWithSegments(SignalRPath.HubPrefix))
        {
            await requestDelegate(httpContext);
            return;
        }
        
        var originalBody = httpContext.Response.Body;
        var countingStream = new CountingStream(originalBody);
        httpContext.Response.Body = countingStream;
            
        var stopwatch = Stopwatch.StartNew();
        await requestDelegate(httpContext);
        stopwatch.Stop();
        
        var userId =
            httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value is { } v && int.TryParse(v, out var uid)
                ? uid
                : (int?)null;
        
        var log = new TrafficLogSerializer
        {
            Method = httpContext.Request.Method,
            Path = httpContext.Request.Path.Value,
            StatusCode = httpContext.Response.StatusCode,
            DurationMs = stopwatch.ElapsedMilliseconds,
            ResponseSizeBytes = countingStream.BytesWritten,
            Ip = httpContext.Connection.RemoteIpAddress?.ToString(),
            UserId = userId
        };

        TrafficBuffer.Logs.Writer.TryWrite(log);
    }
}