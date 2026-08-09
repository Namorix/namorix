using System.Diagnostics;
using Namorix.Core.Constants;
using Namorix.Core.FlatFile;
using Namorix.Core.Helpers;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Middleware.Frontgate;

public class ProxyTrafficMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(TrafficRoutes.Base))
        {
            await next(context);
            return;
        }
        
        var originalBody = context.Response.Body;
        var countingStream = new CountingStream(originalBody);
        context.Response.Body = countingStream;

        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            context.Response.Body = originalBody;

            TrafficBuffer.Logs.Writer.TryWrite(new TrafficLogSerializer
            {
                Source = TrafficSource.Proxy,
                Method = context.Request.Method,
                Path = context.Request.Path.Value,
                StatusCode = context.Response.StatusCode,
                DurationMs = sw.ElapsedMilliseconds,
                ResponseSizeBytes = countingStream.BytesWritten,
                Ip = NetworkHelper.ToDisplayString(context.Connection.RemoteIpAddress)
            });
        }
    }
}
