using Microsoft.AspNetCore.SignalR;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;
using Namorix.Core.Services;

namespace Namorix.Server.Hubs;

public class SignalRTrafficNotifier(IHubContext<NmxHub> hubContext,
    TrafficMonitorService monitorService): ITrafficNotifier
{
    public async Task NotifyFlushAsync() {
        var stats = monitorService.GetStats();
        var series = monitorService.GetTimeSeries();
        var now = DateTime.UtcNow;
        var bucket = series[now.Hour];
        var payload = new
        {
            stats = new
            {
                totalRequests = stats.TotalRequests,
                errorCount = stats.ErrorCount,
                avgDurationMs = stats.AvgDurationMs,
                avgResponseSizeBytes = stats.AvgResponseSizeBytes,
            },
            bucket = new
            {
                hour = now.Hour,
                requests = bucket.Requests,
                errors = bucket.Errors,
                avgDurationMs = Math.Round(bucket.AvgDuration, 2),
                avgSizeBytes = Math.Round(bucket.AvgSize, 2),
            },
        };
        await hubContext.Clients
            .Group(SignalRGroups.Traffic)
            .SendAsync(SignalREvents.TrafficNewLogs, payload);
    }
}