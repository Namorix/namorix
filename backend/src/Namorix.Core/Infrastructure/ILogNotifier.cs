using Namorix.Core.FlatFile;

namespace Namorix.Core.Infrastructure;

public interface ILogNotifier
{
    Task NotifyFlushAsync(IReadOnlyList<LogEntrySerializer> entries);
}