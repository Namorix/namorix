using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.Extensions.Logging;
using Namorix.Core.OAuth;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

public class AddonChannelClient(NmxOAuth2Client oauth, NmxAddonConfig config,
    ILogger<AddonChannelClient> logger) : IAsyncDisposable
{
    private GrpcChannel? _channel;

    private AsyncDuplexStreamingCall<AddonMessage, ShellMessage>? _call;
    private CancellationTokenSource? _cts;
    private Task? _receiveTask;

    // Token independent of the internal _cts, representing the service's lifetime
    // (e.g. ApplicationStopping). StopAsync() cancels _cts but does NOT touch this token,
    // so ReconnectAsync can still use it after StopAsync() has run.
    private CancellationToken _lifetimeCt;

    public event Action<ShellMessage>? OnMessage;
    public bool IsConnected => _call != null;

    public async Task StartAsync(CancellationToken ct = default)
    {
        _lifetimeCt = ct;
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

        var token = await oauth.GetAccessTokenAsync(ct);

        _channel = GrpcChannel.ForAddress(config.GrpcUrl, new GrpcChannelOptions
        {
            HttpHandler = new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(5),
                EnableMultipleHttp2Connections = true
            }
        });

        var stub = new AddonChannel.AddonChannelClient(_channel);
        var headers = new Metadata
        {
            { "Authorization", $"{Constants.OAuth.NmxOAuth2Defaults.Bearer} {token}" }
        };

        _call = stub.Connect(headers, cancellationToken: _cts.Token);
        _receiveTask = ReceiveLoopAsync(_cts.Token);
        _ = ScheduleTokenRefreshAsync(_cts.Token);
    }

    private async Task ReceiveLoopAsync(CancellationToken ct)
    {
        try
        {
            await foreach (var msg in _call!.ResponseStream.ReadAllAsync(ct))
            {
                try
                {
                    OnMessage?.Invoke(msg);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex,
                        "Handler error for ShellMessage type={Type}", msg.Type);
                }
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogDebug("Receive loop cancelled (shutdown)");
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Cancelled)
        {
            logger.LogWarning("Server disconnected the channel");
            _call = null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "gRPC receive loop lost connection, attempting reconnect...");

            // Only reconnect if the service hasn't been asked to shut down.
            // Use _lifetimeCt (not ct/_cts.Token) because StopAsync() inside
            // ReconnectAsync cancels _cts — if we used ct, the Task.Delay below
            // would be cancelled immediately and reconnect would never happen.
            if (!_lifetimeCt.IsCancellationRequested)
                await ReconnectAsync(_lifetimeCt);
        }
    }
    
    public async Task SendAsync(AddonMessage message, CancellationToken ct = default)
    {
        if (_call == null)
            throw new InvalidOperationException("Channel not started. Call StartAsync first.");
        await _call.RequestStream.WriteAsync(message, ct);
    }

    public async Task StopAsync()
    {
        if (_call != null)
        {
            try
            {
                await _call.RequestStream.CompleteAsync();
            }
            catch
            {
                /* ignore */
            }

            _call.Dispose();
            _call = null;
        }

        if (_cts != null)
        {
            await _cts.CancelAsync();
            _cts?.Dispose();
            _cts = null;
        }

        if (_channel != null)
        {
            await _channel.ShutdownAsync();
            _channel.Dispose();
            _channel = null;
        }
    }

    public async ValueTask DisposeAsync() => await StopAsync();
    
    private async Task ReconnectAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await StopAsync();
                await Task.Delay(TimeSpan.FromSeconds(5), ct);
                await StartAsync(ct);
                logger.LogInformation("gRPC reconnected successfully");
                return;

            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "gRPC reconnect attempt failed, retrying in 5s...");
            }
        }
    }
    
    private async Task ScheduleTokenRefreshAsync(CancellationToken ct)
    {
        if (oauth.CurrentTokenExpiresAt is not { } expiresAt)
            return;
        
        var delay = (expiresAt - TimeSpan.FromMinutes(5)) - DateTime.UtcNow;
        if (delay <= TimeSpan.Zero)
            return;
        
        try
        {
            await Task.Delay(delay, ct);
            logger.LogInformation("Access token expiring soon, proactively reconnecting");
            await StopAsync();
            await StartAsync(_lifetimeCt);
            
            _ = ScheduleTokenRefreshAsync(_cts!.Token);
        }
        catch (OperationCanceledException)
        {
        }
    }
    
}