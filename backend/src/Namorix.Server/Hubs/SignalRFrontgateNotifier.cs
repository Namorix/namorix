using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Hubs;

public class SignalRFrontgateNotifier(IHubContext<MainHub> 
    hubContext) : IFrontgateNotifier
{
    public async Task NotifyCertStatusChanged(string certId, string 
        status, string? issuer, DateTime? expiresAt)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Frontgate).SendAsync(ServerSignalREvent.FrontgateCertStatusChanged, new
        {
            certId,
            status,
            issuer,
            expiresAt
        });
    }
}