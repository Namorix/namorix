using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Persistence;
using Namorix.Server.Services;

namespace Namorix.Server.Workers;

public class DockerMonitorWorker(
    IServiceProvider serviceProvider,
    ILogger<DockerMonitorWorker> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("DockerMonitor started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncContainerStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "DockerMonitor sync failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    private async Task SyncContainerStatusesAsync(CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var docker = scope.ServiceProvider.GetRequiredService<DockerService>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAddonNotifier>();

        var containers = await docker.ListContainersAsync();
        var dbAddons = await db.AddonManifests.ToListAsync(ct);

        var containerIds = containers.Select(c => c.ID).ToHashSet();

        foreach (var addon in dbAddons)
        {
            var container = containers.FirstOrDefault(c =>
                c.Labels.TryGetValue("namorix-addon-id", out var id) && id == addon.Id);

            string newStatus;
            if (container is null)
                newStatus = AddonStatus.Error;
            else if (container.State == AddonStatus.Running)
                newStatus = AddonStatus.Running;
            else
                newStatus = AddonStatus.Stopped;

            if (addon.Status != newStatus)
            {
                addon.Status = newStatus;
                await notifier.NotifyAddonStatusChanged(addon.Id, newStatus);
                logger.LogInformation("Addon {Id} status changed to {Status}", addon.Id, newStatus);
            }
        }

        await db.SaveChangesAsync(ct);
    }
}