using System.Collections.Concurrent;
using Grpc.Core;
using Namorix.Core.Protos;

namespace Namorix.Server.Services;

public class AddonChannelManager
{
    private readonly ConcurrentDictionary<string, ChannelContext> _channels = new();
    
    public ChannelContext? Get(string addonId) =>
        _channels.GetValueOrDefault(addonId);
    
    public ChannelContext Register(string addonId, string clientId, CancellationTokenSource cts)
    {
        var ctx = new ChannelContext(addonId, clientId, cts);
        _channels[addonId] = ctx;
        return ctx;
    }

    public void DisconnectAsync(string addonId)
    {
        Console.WriteLine("DisconnectAsync");
        if (_channels.TryRemove(addonId, out var ctx))
        {
            Console.WriteLine("DisconnectAsync: Cancel");
            ctx.Cancel();
        }
    }
    
    public bool IsConnected(string addonId) =>
        _channels.ContainsKey(addonId);

    public async Task BroadcastAsync(ShellMessage message)
    {
        foreach (var ctx in _channels.Values)
        {
            if (ctx.ResponseStream is null)
                continue;
            try
            {
                await ctx.ResponseStream.WriteAsync(message);
            }
            catch
            {
                // Connection likely closed; next DisconnectAsync() removes it.
            }
        }
    }

    // Revoking one user's grant is scoped to the OAuth client that holds it, so it must
    // not travel over the addonId path: one addon can host several clients, and a user
    // logging out of one must not tear down the others.
    public async Task BroadcastToClientAsync(string clientId, ShellMessage message)
    {
        foreach (var ctx in _channels.Values)
        {
            if (ctx.ClientId != clientId || ctx.ResponseStream is null)
                continue;
            try
            {
                await ctx.ResponseStream.WriteAsync(message);
            }
            catch
            {
                // Connection likely closed; next DisconnectAsync() removes it.
            }
        }
    }
}

public class ChannelContext(string addonId, string clientId, CancellationTokenSource cts)
{
    public string AddonId { get; } = addonId;
    public string ClientId { get; } = clientId;
    public CancellationToken Token => cts.Token;
    public IServerStreamWriter<ShellMessage>? ResponseStream { get; set; }
    public void Cancel() => cts.Cancel();
}