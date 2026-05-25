using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.Hubs;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRSystemNotifier(IHubContext<NmxHub> hubContext): ISystemNotifier
{
    public Task NotifyConfigChangedAsync(string key) =>
        hubContext.Clients.All.SendAsync(SignalREvents.SystemConfigChanged, new ConfigChanged(key));
}