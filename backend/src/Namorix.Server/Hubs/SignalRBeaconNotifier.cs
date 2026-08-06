using Microsoft.AspNetCore.SignalR;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Hubs;

public class SignalRBeaconNotifier(IHubContext<MainHub> hubContext) : IBeaconNotifier
{
    public async Task NotifyHostnameStatusChanged(string hostnameId, string hostname, string status)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvent.BeaconHostnameStatusChanged, new
        {
            hostnameId,
            hostname,
            status
        });
    }
    
    public async Task NotifyActivityCreated(BcnActivityLog log, string? hostname)
    {
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvent.BeaconActivityCreated, new
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
        await hubContext.Clients.Group(ServerSignalRGroups.Beacon).SendAsync(ServerSignalREvent.BeaconHostnamesRefreshed, new
        {
            updated
        });
    }
}