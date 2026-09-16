using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.Extensions.Logging;
using Namorix.Core.AddonSession;
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

    // True only while the desktop has proven it is alive on the open stream (it
    // sent the handshake and the receive loop has not ended). This is the addon's
    // availability gate: the desktop is the only auth server, so when we cannot
    // prove it is reachable we must not serve. Deliberately not "does a call
    // object exist" — that was true before the connection was even established.
    private volatile bool _streamUp;

    // Token independent of the internal _cts, representing the service's lifetime
    // (e.g. ApplicationStopping). StopAsync() cancels _cts but does NOT touch this token,
    // so ReconnectAsync can still use it after StopAsync() has run.
    private CancellationToken _lifetimeCt;

    public event Action<ShellMessage>? OnMessage;

    // Same stream of messages, for handlers that need to do I/O (a revocation push has to
    // reach the token store). Awaited inside the receive loop's try/catch, so a failing
    // handler is logged instead of killing the stream.
    public event Func<ShellMessage, Task>? OnMessageAsync;

    public bool IsConnected => _streamUp;
    public string? BrowserOrigin { get; private set; }

    // Newest session list the desktop pushed on this stream, or null when no proven stream
    // has delivered one. Exposed as state and not just an event so a subscriber that
    // attaches after the push can still apply it.
    public IReadOnlyList<AddonSessionRef>? ActiveGrants { get; private set; }

    // Closes the availability gate. Also drops the session list: an unproven channel has no
    // proven truth about which sessions are still alive.
    private void MarkStreamDown()
    {
        _streamUp = false;
        ActiveGrants = null;
    }

    public async Task StartAsync(CancellationToken ct = default)
    {
        _lifetimeCt = ct;
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

        var token = await oauth.GetAccessTokenAsync(ct);

        _channel = GrpcChannel.ForAddress(config.DesktopGrpcUrl, new GrpcChannelOptions
        {
            HttpHandler = new SocketsHttpHandler
            {
                PooledConnectionLifetime = TimeSpan.FromMinutes(5),
                EnableMultipleHttp2Connections = true,
                // Without pings, a desktop that died uncleanly (SIGKILL, half-open
                // TCP, frozen host) looks exactly like a healthy one, so the gate
                // above would stay open forever. Pings turn that into a stream
                // error within seconds.
                KeepAlivePingDelay = TimeSpan.FromSeconds(15),
                KeepAlivePingTimeout = TimeSpan.FromSeconds(10),
                KeepAlivePingPolicy = HttpKeepAlivePingPolicy.Always,
            }
        });

        var stub = new AddonChannel.AddonChannelClient(_channel);
        var headers = new Metadata
        {
            { Constants.OAuth.NmxOAuth2Defaults.Authorization, $"{Constants.OAuth.NmxOAuth2Defaults.Bearer} {token}" }
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
                if (msg.Type == DesktopConfigMessage.TypeHandshake)
                {
                    _streamUp = true;
                    continue;
                }

                try
                {
                    if (msg.Type == DesktopConfigMessage.TypeConfigUpdate)
                        BrowserOrigin = DesktopConfigMessage.ParseDesktopDomain(msg.Payload);

                    if (msg.Type == SessionGrantsMessage.Type)
                    {
                        if (SessionGrantsMessage.Parse(msg.Payload) is { } sessions)
                            ActiveGrants = sessions;
                        else
                            logger.LogWarning("Ignoring unreadable {Type} payload", msg.Type);
                    }

                    OnMessage?.Invoke(msg);

                    if (OnMessageAsync is { } asyncHandler)
                        await asyncHandler(msg);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex,
                        "Handler error for ShellMessage type={Type}", msg.Type);
                }
            }

            // The desktop ended the stream without an error. Nothing is connected
            // any more, so fall through to the reconnect path below instead of
            // leaving the gate open on a channel that no longer exists.
            logger.LogWarning("Addon channel stream ended by the desktop");
        }
        catch (OperationCanceledException)
        {
            // Shutdown, or StopAsync() tearing down for a reconnect or token refresh.
            // Whoever cancelled owns the next transition, so reconnecting here would
            // race their StartAsync and spin — just close the gate and stop.
            logger.LogDebug("Receive loop cancelled");
            MarkStreamDown();
            return;
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.Cancelled)
        {
            logger.LogWarning("Server disconnected the channel");
            _call = null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "gRPC receive loop lost connection, attempting reconnect...");
        }

        // Every non-cancellation exit closes the gate. Fail closed: an unproven
        // channel never serves requests.
        MarkStreamDown();

        // Only reconnect if the service hasn't been asked to shut down.
        // Use _lifetimeCt (not ct/_cts.Token) because StopAsync() inside
        // ReconnectAsync cancels _cts — if we used ct, the Task.Delay below
        // would be cancelled immediately and reconnect would never happen.
        if (!_lifetimeCt.IsCancellationRequested)
            await ReconnectAsync(_lifetimeCt);
    }
    
    public async Task SendAsync(AddonMessage message, CancellationToken ct = default)
    {
        if (_call == null)
            throw new InvalidOperationException("Channel not started. Call StartAsync first.");
        await _call.RequestStream.WriteAsync(message, ct);
    }

    public async Task<OAuthTokenResult> ExchangeUserCodeAsync(
        string code, string clientId, string codeVerifier, CancellationToken ct = default)
    {
        EnsureStarted();
        var stub = new AddonChannel.AddonChannelClient(_channel!);
        return await stub.ExchangeUserCodeAsync(
            new ExchangeCodeRequest
            {
                Code = code,
                ClientId = clientId,
                CodeVerifier = codeVerifier,
                ClientAssertion = await oauth.CreateClientAssertionAsync(ct),
            },
            await BuildAuthHeadersAsync(ct),
            cancellationToken: ct);
    }

    public async Task<OAuthTokenResult> RefreshUserTokenAsync(
        string refreshToken, string clientId, CancellationToken ct = default)
    {
        EnsureStarted();
        var stub = new AddonChannel.AddonChannelClient(_channel!);
        return await stub.RefreshUserTokenAsync(
            new RefreshTokenRequest
            {
                RefreshToken = refreshToken,
                ClientId = clientId,
            },
            await BuildAuthHeadersAsync(ct),
            cancellationToken: ct);
    }

    public async Task<JwksResponse> GetJwksAsync(CancellationToken ct = default)
    {
        EnsureStarted();
        var stub = new AddonChannel.AddonChannelClient(_channel!);
        return await stub.GetJwksAsync(
            new JwksRequest(),
            await BuildAuthHeadersAsync(ct),
            cancellationToken: ct);
    }

    public async Task RevokeGrantAsync(int userId, string sessionId, CancellationToken ct = default)
    {
        EnsureStarted();
        var stub = new AddonChannel.AddonChannelClient(_channel!);
        await stub.RevokeGrantAsync(
            new RevokeGrantRequest { UserId = userId, SessionId = sessionId },
            await BuildAuthHeadersAsync(ct),
            cancellationToken: ct);
    }

    private void EnsureStarted()
    {
        if (_channel == null)
            throw new InvalidOperationException("Channel not started. Call StartAsync first.");
    }

    private async Task<Metadata> BuildAuthHeadersAsync(CancellationToken ct)
    {
        var token = await oauth.GetAccessTokenAsync(ct);
        return new Metadata
        {
            { Constants.OAuth.NmxOAuth2Defaults.Authorization, $"{Constants.OAuth.NmxOAuth2Defaults.Bearer} {token}" }
        };
    }

    public async Task StopAsync()
    {
        // Close the gate first: the call is about to be torn down, so until a new
        // stream hands us proof of life we are not connected.
        MarkStreamDown();

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