using Docker.DotNet;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonTaskExecutor(
    AppDbContext db,
    DockerService docker,
    IAddonNotifier notifier,
    ILogger<AddonTaskExecutor> logger)
{
    public async Task ExecuteAsync(AddonTask task, CancellationToken ct)
    {
        await Task.Delay(1000, ct);
        switch (task.Type)
        {
            case AddonTaskType.Start:
                await StartAsync(task.AddonId, ct);
                break;
            case AddonTaskType.Stop:
                await StopAsync(task.AddonId, ct);
                break;
            case AddonTaskType.Uninstall:
                await UninstallAsync(task.AddonId, ct);
                break;
            case AddonTaskType.Install:
                await InstallAsync(task.InstallRequest!, ct);
                break;
            case AddonTaskType.Update:
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(task), task.Type, "Unsupported addon task type.");
        }
    }

    private async Task StartAsync(string addonId, CancellationToken ct) {  }
    private async Task StopAsync(string addonId, CancellationToken ct) { }

    private async Task UninstallAsync(string addonId, CancellationToken ct)
    {
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        
        if (addon is null)
        {
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Uninstalling);
            return;
        }
        
        try
        {
            await docker.StopContainerAsync(addonId);
            await docker.RemoveContainerAsync(addonId);
        }
        catch (DockerContainerNotFoundException)
        {
            logger.LogWarning("Container {Id} already gone during uninstall", addonId);
        }

        db.AddonInstallations.Remove(addon);
        await db.SaveChangesAsync(ct);
        await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Uninstalling);
    }
    
    
    private async Task InstallAsync(InstallRequest request, CancellationToken ct) {  }

    private async Task SetStatusAsync(string addonId, string status, string? error = null) {  }

    private async Task<string?> FindContainerIdAsync(string addonId)
    {
        return "";
    }
}