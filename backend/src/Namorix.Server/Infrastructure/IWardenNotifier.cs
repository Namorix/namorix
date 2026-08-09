using Namorix.Server.Models.Warden;

namespace Namorix.Server.Infrastructure;

public interface IWardenNotifier
{
    Task NotifyNewEvent(WdSecurityEvent evt);
}