namespace Namorix.Server.Infrastructure;

public interface ISystemMonitorNotifier
{
    Task NotifyStatsAsync(object stats);
}