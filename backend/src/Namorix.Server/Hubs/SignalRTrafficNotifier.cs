using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Hubs;
using Namorix.Core.Infrastructure;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Services;

namespace Namorix.Server.Hubs;

public class SignalRTrafficNotifier<THub>(IHubContext<THub> hubContext,
    TrafficMonitorService monitorService): ITrafficNotifier where THub: NmxHub
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
            .Group(ServerSignalRGroups.Traffic)
            .SendAsync(ServerSignalREvents.TrafficNewLogs, payload);
    }
}