using System.Threading.Channels;
using Namorix.Core.FlatFile;

namespace Namorix.Core.Infrastructure;

public static class TrafficBuffer
{
    public static readonly Channel<TrafficLogSerializer> Logs = Channel.CreateBounded<TrafficLogSerializer>(new BoundedChannelOptions(50000)
    {
        FullMode = BoundedChannelFullMode.DropOldest
    });
}