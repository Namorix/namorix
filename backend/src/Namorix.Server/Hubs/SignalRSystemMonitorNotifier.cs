using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRSystemMonitorNotifier(IHubContext<MainHub> hubContext) : ISystemMonitorNotifier
{
    public async Task NotifyStatsAsync(object stats) =>
        await hubContext.Clients.Group(ServerSignalRGroups.SystemMonitor)
            .SendAsync(ServerSignalREvent.SystemMonitorStatsUpdate, stats);
}