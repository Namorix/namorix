using System.Collections.Concurrent;
using Grpc.Core;
using Namorix.Core.Protos;

namespace Namorix.Server.Services;

public class AddonChannelManager
{
    private readonly ConcurrentDictionary<string, ChannelContext> _channels = new();
    
    public ChannelContext? Get(string addonId) =>
        _channels.GetValueOrDefault(addonId);
    
    public ChannelContext Register(string addonId, CancellationTokenSource cts)
    {
        var ctx = new ChannelContext(addonId, cts);
        _channels[addonId] = ctx;
        return ctx;
    }
    
    public void DisconnectAsync(string addonId)
    {
        if (_channels.TryRemove(addonId, out var ctx))
            ctx.Cancel();
    }
    
    public bool IsConnected(string addonId) =>
        _channels.ContainsKey(addonId);
}

public class ChannelContext(string addonId, CancellationTokenSource cts)
{
    public string AddonId { get; } = addonId;
    public CancellationToken Token => cts.Token;
    public IServerStreamWriter<ShellMessage>? ResponseStream { get; set; }
    public void Cancel() => cts.Cancel();
}