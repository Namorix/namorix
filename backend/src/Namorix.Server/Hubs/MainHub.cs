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
        var cached = SystemMonitorStatsWorker.LatestStats;
        if (cached != null)
            await Clients.Caller.SendAsync(ServerSignalREvent.SystemMonitorStatsUpdate, cached);
    }
    
    public async Task UnsubscribeSystemMonitor()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.SystemMonitor);
    }
    
    public async Task SubscribeBeacon()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.Beacon);
    }

    public async Task UnsubscribeBeacon()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.Beacon);
    }
    
    public async Task SubscribeFrontgate()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.Frontgate);
    }

    public async Task UnsubscribeFrontgate()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.Frontgate);
    }
    
    public async Task SubscribeWarden()
        => await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.Warden);

    public async Task UnsubscribeWarden()
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.Warden);
}