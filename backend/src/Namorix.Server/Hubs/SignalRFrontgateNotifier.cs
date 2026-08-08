using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;

namespace Namorix.Server.Hubs;

public class SignalRFrontgateNotifier(IHubContext<MainHub> 
    hubContext) : IFrontgateNotifier
{
    public async Task NotifyCertStatusChanged(string certId, FgCertificateStatus 
        status, string? issuer, DateTime? expiresAt)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Frontgate).SendAsync(ServerSignalREvent.FrontgateCertStatusChanged, new
        {
            certId,
            status = status.ToString().ToLowerInvariant(),
            issuer,
            expiresAt
        });
    }
    
    public async Task NotifyDryRunChanged(string ruleId, FgDryRunAction action)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Frontgate).SendAsync(ServerSignalREvent.FrontgateDryRunChanged, new
        {
            ruleId,
            action = action.ToString().ToLowerInvariant()
        });
    }
    
    public async Task NotifyRuleChanged(string ruleId, FgRuleAction action)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Frontgate).SendAsync(ServerSignalREvent.FrontgateRuleChanged, new
        {
            ruleId,
            action = action.ToString().ToLowerInvariant()
        });
    }
    
    public async Task NotifyCertChanged(string certId, FgCertAction action)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Frontgate).SendAsync(ServerSignalREvent.FrontgateCertChanged, new
        {
            certId,
            action = action.ToString().ToLowerInvariant()
        });
    }
}