namespace Namorix.Core.Infrastructure;

public interface ISystemNotifier
{
    Task NotifyConfigChangedAsync(string key);
}