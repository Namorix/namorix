using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Namorix.Core.Grpc;

public abstract class AddonHostedServiceBase(AddonChannelClient channel,
    ILogger<AddonHostedServiceBase> logger, TimeSpan? retryDelay = null) : IHostedService
{
    private readonly TimeSpan _retryDelay = retryDelay ?? TimeSpan.FromSeconds(5);
    private CancellationTokenSource? _cts;
    private Task? _connectTask;

    protected AddonChannelClient Channel { get; } = channel;

    public Task StartAsync(CancellationToken ct)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        
        ConfigureHandlers(Channel);
        _connectTask = ConnectWithRetryAsync(_cts.Token);

        return Task.CompletedTask;
    }

    private async Task ConnectWithRetryAsync(CancellationToken ct)
    {
        var attempt = 0;
 
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await Channel.StartAsync(ct);
                logger.LogInformation("Connected to Namorix server");
 
                await OnConnectedAsync(ct);
                return;
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex)
            {
                attempt++;
 
                // Full exception + stack trace only on the very first failure,
                // so we know what's actually wrong. After that, the reason is
                // already known (e.g. server not up yet), so just log a short
                // one-liner each retry instead of spamming the same stack trace.
                if (attempt == 1)
                {
                    logger.LogWarning(ex,
                        "Failed to connect to Namorix server, retrying every {Delay}s...",
                        _retryDelay.TotalSeconds);
                }
                else
                {
                    logger.LogWarning(
                        "Still failed to connect to Namorix server ({Reason}), attempt {Attempt}...",
                        ex.Message, attempt);
                }
 
                try
                {
                    await Task.Delay(_retryDelay, ct);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }
    }
    
    protected abstract void ConfigureHandlers(AddonChannelClient channel);
    protected abstract Task OnConnectedAsync(CancellationToken ct);

    public virtual async Task StopAsync(CancellationToken ct)
    {
        if (_cts != null)
            await _cts.CancelAsync();

        if (_connectTask != null)
        {
            try
            {
                await _connectTask;
            }
            catch
            {
                /* already logged inside ConnectWithRetryAsync */
            }
        }

        await Channel.StopAsync();
    }
}