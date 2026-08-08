using Namorix.Server.Constants;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Infrastructure;

public interface IBeaconNotifier
{
    Task NotifyHostnameStatusChanged(string hostnameId, string hostname, BcnHostnameStatus status);
    Task NotifyActivityCreated(BcnActivityLog log, string? hostname);
    Task NotifyHostnamesRefreshed(int updated);
    Task NotifyHostnameChanged(string hostnameId, string hostname, BcnHostnameAction action);

}