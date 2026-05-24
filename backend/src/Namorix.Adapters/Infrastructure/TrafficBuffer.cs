using System.Threading.Channels;
using Namorix.Adapters.FlatFile;

namespace Namorix.Adapters.Infrastructure;

public static class TrafficBuffer
{
    public static readonly Channel<TrafficLogSerializer> Logs = Channel.CreateBounded<TrafficLogSerializer>(new BoundedChannelOptions(50000)
    {
        FullMode = BoundedChannelFullMode.DropOldest
    });
}