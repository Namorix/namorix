using System.Threading.Channels;
using Namorix.Core.FlatFile;

namespace Namorix.Core.Infrastructure;

public static class LogBuffer
{
    public static readonly Channel<LogEntrySerializer> Entries =
        Channel.CreateBounded<LogEntrySerializer>(new BoundedChannelOptions(50000)
        {
            FullMode = BoundedChannelFullMode.DropOldest
        });
}