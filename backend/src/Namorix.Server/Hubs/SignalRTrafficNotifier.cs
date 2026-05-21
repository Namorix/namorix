using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRTrafficNotifier(IHubContext<NmxHub> hubContext): ITrafficNotifier
{
    public Task NotifyFlushAsync(int count) =>
        hubContext.Clients.Group(SignalGroups.Traffic)
            .SendAsync(SignalEvents.TrafficNewLogs, new TrafficLogsFlushed(count));
}