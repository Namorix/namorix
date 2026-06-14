using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Core.Hubs;

public class SignalRSystemNotifier<THub>(IHubContext<THub> hubContext): ISystemNotifier where THub: NmxHub
{
    public Task NotifyConfigChangedAsync(string key) =>
        hubContext.Clients.All.SendAsync(SignalREvents.SystemConfigChanged, new ConfigChanged(key));
}