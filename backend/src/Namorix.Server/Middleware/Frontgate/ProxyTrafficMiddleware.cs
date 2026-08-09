using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;
using Namorix.Core.Constants;
using Namorix.Core.FlatFile;
using Namorix.Core.Helpers;
using Namorix.Core.Infrastructure;
using Namorix.Server.Constants;
using Namorix.Server.Models.Warden;
using Namorix.Server.Services.Warden;

namespace Namorix.Server.Middleware.Frontgate;

public class ProxyTrafficMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory)
{
    // Debounce SCAN_404: lưu lần ghi event gần nhất của mỗi IP
    private static readonly ConcurrentDictionary<string, DateTime> ScanWindow = new();

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(TrafficRoutes.Base) ||
            context.Request.Path.StartsWithSegments(SignalRPath.HubPrefix))
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

            await PublishScanIfDueAsync(context);
        }
    }

    private async Task PublishScanIfDueAsync(HttpContext context)
    {
        if (context.Response.StatusCode != StatusCodes.Status404NotFound)
            return;

        var ip = NetworkHelper.ToDisplayString(context.Connection.RemoteIpAddress) ?? string.Empty;
        var now = DateTime.UtcNow;

        // 1 event/IP/5-minute window — prevents DB flooding when the bot scans hundreds of requests/second
        if (ScanWindow.TryGetValue(ip, out var last) && now - last < TimeSpan.FromMinutes(5))
            return;
        ScanWindow[ip] = now;

        using var scope = scopeFactory.CreateScope();
        await scope.ServiceProvider.GetRequiredService<WdEventService>()
            .PublishAsync(WdEventTypes.Scan404, WdSeverity.Info, AddonSourceId.Frontgate, ip,
                detailJson: JsonSerializer.Serialize(new { path = context.Request.Path.Value }));
    }
}