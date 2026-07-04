using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRAddonNotifier(IHubContext<MainHub> hubContext)
    : IAddonNotifier
{
    public async Task NotifyAddonStatusChanged(string addonId, string status, string? lastErrorCode = null)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvent.AddonStatusChanged, new
        {
            addonId,
            status,
            lastErrorCode
        });
    }
    
    public async Task NotifyPendingTaskChanged(string addonId, string? taskPhase)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvent.AddonPendingTaskChanged, new
        {
            addonId,
            taskPhase
        });
    }
    
    public async Task NotifyAddonUninstalled(string addonId)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvent.AddonUninstalled, new
        {
            addonId
        });
    }

    public async Task NotifyAddonWidgetEvent(string addonId, string payload)
    {
        await hubContext.Clients.All.SendAsync(ServerSignalREvent.AddonWidgetEvent, new
        {
            addonId,
            payload
        });
    }
}