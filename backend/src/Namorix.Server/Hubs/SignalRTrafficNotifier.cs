using Microsoft.AspNetCore.SignalR;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRTrafficNotifier(IHubContext<NmxHub> hubContext,
    TrafficMonitorService monitorService): ITrafficNotifier
{
    public async Task NotifyFlushAsync() {
        var endpoint = await monitorService.GetStats(null, null);
        var record = new TrafficLogsFlushed(
            (int)endpoint.TotalRequests,
            (int)endpoint.ErrorCount,
            endpoint.AvgDurationMs,
            endpoint.AvgResponseSizeBytes
        );
        
        await hubContext.Clients
            .Groups(SignalRGroups.Traffic)
            .SendAsync(SignalREvents.TrafficNewLogs, record);
    }
}