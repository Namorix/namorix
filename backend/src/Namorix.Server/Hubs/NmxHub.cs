using Microsoft.AspNetCore.SignalR;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Server.Hubs;

public class NmxHub(ITrafficNotifier trafficNotifier): Hub
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
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
        await trafficNotifier.NotifyFlushAsync();
    }

    public async Task UnsubscribeTraffic()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
    }
}