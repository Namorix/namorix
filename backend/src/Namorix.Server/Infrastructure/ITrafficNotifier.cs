namespace Namorix.Server.Infrastructure;

public interface ITrafficNotifier
{
    Task NotifyFlushAsync();
}