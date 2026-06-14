using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Hubs;
using Namorix.Core.Services;
using Namorix.Server.Constants;
using Namorix.Server.Workers;

namespace Namorix.Server.Hubs;

public class MainHub(TrafficMonitorService monitorService, ILogger<MainHub> logger)
    : NmxHub(monitorService, logger)
{
    public async Task SubscribeSystemMonitor()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.SystemMonitor);
        var cached = SystemStatsWorker.LatestStats;
        if (cached != null)
            await Clients.Caller.SendAsync(ServerSignalREvent.SystemMonitorStatsUpdate, cached);
    }
    
    public async Task UnsubscribeSystemMonitor()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.SystemMonitor);
    }
}