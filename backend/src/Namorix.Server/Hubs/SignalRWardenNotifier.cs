using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Warden;

namespace Namorix.Server.Hubs;

public class SignalRWardenNotifier(IHubContext<MainHub> hubContext) : IWardenNotifier
{
    public async Task NotifyNewEvent(WdSecurityEvent evt)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Warden)
            .SendAsync(ServerSignalREvents.WardenNewEvent, new
            {
                evt.Id, evt.EventType, evt.Severity, evt.SourceAddon,
                evt.SourceIp, evt.Count, evt.Timestamp
            });
    }
}