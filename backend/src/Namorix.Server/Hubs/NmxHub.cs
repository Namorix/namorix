using Microsoft.AspNetCore.SignalR;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Hubs;

public class NmxHub(ITrafficNotifier trafficNotifier,
    TrafficMonitorService monitorService): Hub
{
    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated != true)
        {
            Context.Abort();
            return;
        }

        await base.OnConnectedAsync();
    }

    public async Task SubscribeTraffic()
    {
        var roleClaim = Context.User?.Claims.FirstOrDefault(c => c.Type == JwtClaims.Role)?.Value;
        if (roleClaim == null || int.Parse(roleClaim) != UserRole.Admin)
            throw new HubException("Forbidden");
        
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
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
    }
}