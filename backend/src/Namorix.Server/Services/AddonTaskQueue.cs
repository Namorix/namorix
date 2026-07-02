using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonTaskQueue(IServiceScopeFactory scopeFactory, ILogger<AddonTaskQueue> logger)
    : BackgroundService
{
    private readonly Channel<AddonTask> _channel =
        Channel.CreateBounded<AddonTask>(new BoundedChannelOptions(50)
        {
            FullMode = BoundedChannelFullMode.Wait
        });
    private readonly SemaphoreSlim _concurrency = new(2, 2);

    public async Task EnqueueAsync(AddonTask task)
    {
        await _channel.Writer.WriteAsync(task);
        logger.LogInformation("Enqueued {Type} task for addon {Id}", task.Type, task.AddonId);
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var task in _channel.Reader.ReadAllAsync(ct))
        {
            await _concurrency.WaitAsync(ct);
            _ = ProcessAsync(task, ct);
        }
    }

    private async Task ProcessAsync(AddonTask task, CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var docker = scope.ServiceProvider.GetRequiredService<DockerService>();
            var notifier = scope.ServiceProvider.GetRequiredService<IAddonNotifier>();
            var executorLogger = scope.ServiceProvider.GetRequiredService<ILogger<AddonTaskExecutor>>();
            var service = new AddonTaskExecutor(db, docker, notifier, executorLogger);
            
            await service.ExecuteAsync(task, ct);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogError(ex, "Task {Id} ({Type}/{Addon}) failed", task.Id, task.Type, task.AddonId);
            await SetErrorStatusAsync(task.AddonId, ex.Message);
        }
        finally
        {
            _concurrency.Release();
        }
    }

    private async Task SetErrorStatusAsync(string addonId, string error)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<IAddonNotifier>();

            await db.AddonInstallations
                .Where(a => a.Id == addonId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(a => a.Status, AddonStatus.Error)
                    .SetProperty(a => a.LastErrorMessage, error)
                    .SetProperty(a => a.PendingTaskId, null as string)
                    .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow));

            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error);
        }
        catch { /* silent */ }
    }
}