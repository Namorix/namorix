using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRAddonNotifier(IHubContext<MainHub> hubContext)
    : IAddonNotifier
{
    public async Task NotifyAddonStatusChanged(string addonId, string status)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvent.AddonStatusChanged, new
        {
            addonId,
            status
        });
    }
}