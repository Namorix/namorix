namespace Namorix.Core.Infrastructure;

public interface ITrafficNotifier
{
    Task NotifyFlushAsync(int count);
}