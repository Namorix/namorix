using System.Threading.Channels;
using Namorix.Core.Models;

namespace Namorix.Core.Infrastructure;

public static class TrafficBuffer
{
    public static readonly Channel<TrafficLog> Logs = Channel.CreateBounded<TrafficLog>(new BoundedChannelOptions(50000)
    {
        FullMode = BoundedChannelFullMode.DropOldest
    });
}