using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;

namespace Namorix.Server.Hubs;

public class NmxHub: Hub
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
    }

    public async Task UnsubscribeTraffic()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Traffic);
    }
}