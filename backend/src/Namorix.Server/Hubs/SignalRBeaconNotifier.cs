using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Hubs;

public class SignalRBeaconNotifier(IHubContext<MainHub> hubContext) : IBeaconNotifier
{
    public async Task NotifyHostnameStatusChanged(string hostnameId, string hostname, BcnHostnameStatus status)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvents.BeaconHostnameStatusChanged, new
        {
            hostnameId,
            hostname,
            status = status.ToString().ToLowerInvariant()
        });
    }
    
    public async Task NotifyActivityCreated(BcnActivityLog log, string? hostname)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvents.BeaconActivityCreated, new
        {
            id = log.Id,
            timestamp = log.Timestamp,
            level = log.Level.ToString().ToLowerInvariant(),
            code = log.Code,
            paramsJson = log.ParamsJson,
            hostname
        });
    }
    
    public async Task NotifyHostnamesRefreshed(int updated)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvents.BeaconHostnamesRefreshed, new
        {
            updated
        });
    }
    
    public async Task NotifyHostnameChanged(string hostnameId, string hostname, BcnHostnameAction action)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvents.BeaconHostnameChanged, new
        {
            hostnameId,
            hostname,
            action = action.ToString().ToLowerInvariant()
        });
    }
}