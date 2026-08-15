using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Hubs;
using Namorix.Core.Services;
using Namorix.Server.Constants;
using Namorix.Server.Services;
using Namorix.Server.Workers;

namespace Namorix.Server.Hubs;

public class MainHub(TrafficMonitorService monitorService, ILogger<MainHub> logger)
    : NmxHub(logger)
{
    
    public async Task SubscribeTraffic()
    {
        
        Context.RequireAdmin(logger);

        var userId = Context.UserIdentifier;
        logger.LogInformation("SignalR subscribe traffic: userId={UserId}, connectionId={ConnectionId}",
            userId, Context.ConnectionId);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.Traffic);
        
        var stats = monitorService.GetStats();
        var series = monitorService.GetTimeSeries();
        var initPayload = new {
            stats = new {
                totalRequests = stats.TotalRequests,
                errorCount = stats.ErrorCount,
                avgDurationMs = stats.AvgDurationMs,
                avgResponseSizeBytes = stats.AvgResponseSizeBytes,
            },
            buckets = series.Select(b => new {
                hour = b.Hour,
                requests = b.Requests,
                errors = b.Errors,
                avgDurationMs = Math.Round(b.AvgDuration, 2),
                avgSizeBytes = Math.Round(b.AvgSize, 2),
            }).ToArray(),
        };
        await Clients.Caller.SendAsync(ServerSignalREvents.TrafficStatsInit, initPayload);
    }

    public async Task UnsubscribeTraffic()
    {
        logger.LogInformation("SignalR unsubscribe traffic: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ServerSignalRGroups.Traffic);
    }
    
    public async Task SubscribeSystemMonitor()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ServerSignalRGroups.SystemMonitor);
        var cached = SystemMonitorStatsWorker.LatestStats;
        if (cached != null)
            await Clients.Caller.SendAsync(ServerSignalREvents.SystemMonitorStatsUpdate, cached);
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