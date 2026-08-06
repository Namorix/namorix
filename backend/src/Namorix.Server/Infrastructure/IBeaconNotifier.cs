using Namorix.Server.Models;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Infrastructure;

public interface IBeaconNotifier
{
    Task NotifyHostnameStatusChanged(string hostnameId, string hostname, string status);
    Task NotifyActivityCreated(BcnActivityLog log, string? hostname);
    Task NotifyHostnamesRefreshed(int updated);
}