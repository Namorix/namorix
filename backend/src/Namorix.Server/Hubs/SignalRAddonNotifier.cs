using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRAddonNotifier(IHubContext<MainHub> hubContext)
    : IAddonNotifier
{
    public async Task NotifyAddonStatusChanged(string addonId, string status, string? lastErrorCode = null)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvents.AddonStatusChanged, new
        {
            addonId,
            status,
            lastErrorCode
        });
    }
    
    public async Task NotifyPendingTaskChanged(string addonId, string? taskPhase)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvents.AddonPendingTaskChanged, new
        {
            addonId,
            taskPhase
        });
    }
    
    public async Task NotifyAddonUninstalled(string addonId)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvents.AddonUninstalled, new
        {
            addonId
        });
    }

    public async Task NotifyAddonWidgetEvent(string addonId, string payload)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvents.AddonWidgetEvent, new
        {
            addonId,
            payload
        });
    }
}