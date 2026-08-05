using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public sealed class BcnUpdateQueue(IServiceScopeFactory scopeFactory, ILogger<BcnUpdateQueue> logger)
    : BackgroundService
{
    private readonly Channel<string> _channel =
        Channel.CreateBounded<string>(new BoundedChannelOptions(50)
        {
            FullMode = BoundedChannelFullMode.Wait
        });
    private readonly SemaphoreSlim _concurrency = new(2, 2);

    public async Task EnqueueAsync(string hostnameId)
    {
        await _channel.Writer.WriteAsync(hostnameId);
        logger.LogInformation("Enqueued beacon update for hostname {Id}", hostnameId);
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await RequeuePendingAsync(ct);
        await foreach (var hostnameId in _channel.Reader.ReadAllAsync(ct))
        {
            await _concurrency.WaitAsync(ct);
            _ = ProcessAsync(hostnameId, ct);
        }
    }

    private async Task RequeuePendingAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var pendingIds = await db.BcnHostnames
                .Where(h => h.Status == BcnHostnameStatus.Pending)
                .Select(h => h.Id)
                .ToListAsync(ct);
            foreach (var id in pendingIds)
            {
                _channel.Writer.TryWrite(id);
                logger.LogInformation("Requeued orphaned pending beacon hostname {Id}", id);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to requeue pending beacon hostnames on startup");
        }
    }

    private async Task ProcessAsync(string hostnameId, CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updater = scope.ServiceProvider.GetRequiredService<BcnHostnameService>();

            var host = await db.BcnHostnames.FindAsync([hostnameId], ct);
            if (host == null)
                return;

            await updater.UpdateHostWithDetectedIpAsync(host, force: true, ct);
            await db.SaveChangesAsync(ct);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogError(ex, "Beacon background update for hostname {Id} failed", hostnameId);
            await SetErrorStatusAsync(hostnameId);
        }
        finally
        {
            _concurrency.Release();
        }
    }

    private async Task SetErrorStatusAsync(string hostnameId)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<IBeaconNotifier>();
            var host = await db.BcnHostnames.FirstOrDefaultAsync(h => h.Id == hostnameId);
            if (host == null)
                return;

            await db.BcnHostnames
                .Where(h => h.Id == hostnameId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(h => h.Status, BcnHostnameStatus.Error)
                    .SetProperty(h => h.LastError, BcnErrorCodes.ProviderError));
            await notifier.NotifyHostnameStatusChanged(hostnameId, host.Hostname, "error");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to set error status for hostname {Id}", hostnameId);
        }
    }
}