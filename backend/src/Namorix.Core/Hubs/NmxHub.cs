using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;
using Namorix.Core.Services;

namespace Namorix.Core.Hubs;

public class NmxHub(TrafficMonitorService monitorService, ILogger<NmxHub> logger): Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated != true)
        {
            logger.LogWarning("SignalR connection rejected: no auth, connectionId={ConnectionId}",
                Context.ConnectionId);
            
            Context.Abort();
            return;
        }

        logger.LogInformation("SignalR connected: userId={UserId}, connectionId={ConnectionId}",
            Context.UserIdentifier, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        logger.LogInformation("SignalR disconnected: connectionId={ConnectionId}, error={Error}",
            Context.ConnectionId, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeTraffic()
    {
        
        Context.RequireAdmin(logger);

        var userId = Context.UserIdentifier;
        logger.LogInformation("SignalR subscribe traffic: userId={UserId}, connectionId={ConnectionId}",
            userId, Context.ConnectionId);
        
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
        
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
        await Clients.Caller.SendAsync(SignalREvents.TrafficStatsInit, initPayload);
    }

    public async Task UnsubscribeTraffic()
    {
        logger.LogInformation("SignalR unsubscribe traffic: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
    }
    
    public async Task SubscribeLogs()
    {
        Context.RequireAdmin(logger);

        logger.LogInformation("SignalR subscribe logs: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Logs);
    }

    public async Task UnsubscribeLogs()
    {
        logger.LogInformation("SignalR unsubscribe logs: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Logs);
    }
}