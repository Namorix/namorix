using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.Models;
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
    private DateTime _lastEventTime = DateTime.MinValue;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("DockerMonitor started");
        // Initial full sync
        await SyncAllContainersAsync(stoppingToken);
        // Run watcher + poll concurrently
        var watchTask = WatchContainerEventsAsync(stoppingToken);
        var pollTask = PollLoopAsync(stoppingToken);
        await Task.WhenAll(watchTask, pollTask);
    }


    private async Task PollLoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), ct);

            if (DateTime.UtcNow - _lastEventTime < TimeSpan.FromMinutes(5))
                continue;
            
            logger.LogWarning("No Docker events for 5min, running full sync");
            await SyncAllContainersAsync(ct);
            _lastEventTime = DateTime.UtcNow;
        }
    }

    private async Task SyncAllContainersAsync(CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var docker = scope.ServiceProvider.GetRequiredService<DockerService>();
        var notifier = scope.ServiceProvider.GetRequiredService<IAddonNotifier>();
        var containers = await docker.ListContainersAsync();
        await SyncContainersAsync(db, notifier, containers, ct);
    }

    private async Task SyncContainersAsync(
        AppDbContext db,
        IAddonNotifier notifier,
        IList<ContainerListResponse> containers,
        CancellationToken ct)
    {
        var dbAddons = await db.AddonInstallations.ToListAsync(ct);
        var dbAddonIds = dbAddons.Select(a => a.Id).ToHashSet();
        foreach (var container in containers)
        {
            if (!container.Labels.TryGetValue(AddonLabels.Id, out var addonId))
                continue;
            if (!dbAddonIds.Contains(addonId))
            {
                // Auto-discover
                container.Labels.TryGetValue(AddonLabels.Name, out var name);
                container.Labels.TryGetValue(AddonLabels.Description, out var description);
                container.Labels.TryGetValue(AddonLabels.Author, out var author);
                
                var hostPort = container.Ports?.FirstOrDefault()?.PublicPort ?? 0;
                
                db.AddonInstallations.Add(new AddonInstallation
                {
                    Id = addonId,
                    Name = name ?? addonId,
                    Description = description,
                    Author = author,
                    Image = container.Image ?? addonId,
                    HostPort = hostPort,
                    Status = container.State == DockerState.Running
                        ? AddonStatus.Running : AddonStatus.Stopped,
                    InstalledAt = DateTime.UtcNow,
                });
                
                await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Running);
                logger.LogInformation("Auto-discovered addon {Id}", addonId);
            }
            else
            {
                SyncSingleAddon(container, addonId, dbAddons);
            }
        }
        // Orphaned addons → error
        var containerAddonIds = containers
            .Where(c => c.Labels.TryGetValue(AddonLabels.Id, out _))
            .Select(c => c.Labels[AddonLabels.Id])
            .ToHashSet();
        
        foreach (var addon in dbAddons.Where(a =>
            !containerAddonIds.Contains(a.Id) && a.Status != AddonStatus.Error))
        {
            addon.Status = AddonStatus.Error;
            await notifier.NotifyAddonStatusChanged(addon.Id, AddonStatus.Error);
        }
        
        await db.SaveChangesAsync(ct);
    }
      
    private void SyncSingleAddon(
        ContainerListResponse container,
        string addonId,
        List<AddonInstallation> dbAddons)
    {
        var addon = dbAddons.First(a => a.Id == addonId);
        var newStatus = container.State switch
        {
            DockerState.Running => AddonStatus.Running,
            _ => AddonStatus.Stopped,
        };

        if (container.Labels.TryGetValue(AddonLabels.Name, out var name))
            addon.Name = name;

        if (container.Labels.TryGetValue(AddonLabels.Description, out var desc))
            addon.Description = desc;
        if (container.Labels.TryGetValue(AddonLabels.Author, out var author))
            addon.Author = author;
        
        if (container.Ports?.FirstOrDefault()?.PublicPort is { } port and > 0)
            addon.HostPort = port;
        
        if (addon.Status == newStatus)
            return;

        addon.Status = newStatus;
        logger.LogInformation("Addon {Id} → {Status}", addon.Id, newStatus);
    }
    
    private async Task WatchContainerEventsAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var docker = scope.ServiceProvider.GetRequiredService<DockerService>();
                var tcs = new TaskCompletionSource();
                ct.Register(() => tcs.TrySetCanceled());
                
                await docker.Client.System.MonitorEventsAsync(
                    new ContainerEventsParameters
                    {
                        Filters = new Dictionary<string, IDictionary<string, bool>>
                        {
                            [DockerFilter.Type] = new Dictionary<string, bool> { [DockerFilter.Container] = true },
                            [DockerFilter.Label] = new Dictionary<string, bool> { [AddonLabels.Addon] = true },
                        },
                    },
                    new Progress<Message>(msg =>
                    {
                        if (msg.Type != DockerFilter.Container)
                            return;
                        
                        if (msg.Action is not (
                            DockerEvent.Start or DockerEvent.Stop or
                            DockerEvent.Die or DockerEvent.Destroy
                        )) return;

                        if (msg.Actor?.Attributes == null)
                            return;

                        _lastEventTime = DateTime.UtcNow;
                        _ = HandleEventAsync(msg.Actor.ID, msg.Action, msg.Actor.Attributes, ct);
                    }),
                    ct);
                // Keep stream open
                await tcs.Task;
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Docker events stream disconnected, reconnecting...");
                await Task.Delay(1000, ct);
            }
        }
    }

    private async Task SetAddonStatusAsync(
        AppDbContext db,
        IAddonNotifier notifier,
        string addonId,
        string status,
        CancellationToken ct)
    {
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (addon == null) return;
        addon.Status = status;
        await notifier.NotifyAddonStatusChanged(addonId, status);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Addon {Id} → {Status}", addonId, status);
    }
    
    private async Task HandleEventAsync(
        string containerId,
        string action,
        IDictionary<string, string> attributes,
        CancellationToken ct)
    {
        if (!attributes.TryGetValue(AddonLabels.Id, out var addonId))
            return;
        
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notifier = scope.ServiceProvider.GetRequiredService<IAddonNotifier>();
            
            switch (action)
            {
                case DockerEvent.Start:
                {
                    var docker = scope.ServiceProvider.GetRequiredService<DockerService>();
                    var container = (await docker.ListContainersAsync())
                        .FirstOrDefault(c => c.ID == containerId);
                    if (container != null)
                        await SyncContainersAsync(db, notifier, [container], ct);
                    break;
                }
                
                case DockerEvent.Stop:
                case DockerEvent.Die:
                    await SetAddonStatusAsync(db, notifier, addonId, AddonStatus.Stopped, ct);
                    break;
                
                case DockerEvent.Destroy:
                    await SetAddonStatusAsync(db, notifier, addonId, AddonStatus.Error, ct);
                    break;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to handle event for container {Id}", containerId);
        }
    }
    
}