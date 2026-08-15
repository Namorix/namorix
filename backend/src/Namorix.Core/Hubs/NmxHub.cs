using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;
using Namorix.Core.Services;

namespace Namorix.Core.Hubs;

public class NmxHub(ILogger<NmxHub> logger): Hub
{
    protected virtual bool RequireAuthenticatedConnection => true;
    
    public override async Task OnConnectedAsync()
    {
        if (RequireAuthenticatedConnection && Context.User?.Identity?.IsAuthenticated != true)
        {
            logger.LogWarning("SignalR connection rejected: no auth, connectionId={ConnectionId}",
                Context.ConnectionId);
            
            Context.Abort();
            return;
        }

        logger.LogInformation("SignalR connected: userId={UserId}, connectionId={ConnectionId}",
            Context.UserIdentifier, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        logger.LogInformation("SignalR disconnected: connectionId={ConnectionId}, error={Error}",
            Context.ConnectionId, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }
    
    public async Task SubscribeLogs()
    {
        Context.RequireAdmin(logger);

        logger.LogInformation("SignalR subscribe logs: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Logs);
    }

    public async Task UnsubscribeLogs()
    {
        logger.LogInformation("SignalR unsubscribe logs: connectionId={ConnectionId}",
            Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Logs);
    }
}