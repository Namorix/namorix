using Namorix.Server.Models;

namespace Namorix.Server.Infrastructure;

public interface IBeaconNotifier
{
    Task NotifyHostnameStatusChanged(string hostnameId, string hostname, string status);
    Task NotifyActivityCreated(BcnActivityLog log, string? hostname);
    Task NotifyHostnamesRefreshed(int updated);
}