using System.Text.Json;
using Docker.DotNet;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.Models;
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
    private static readonly JsonSerializerOptions CatalogPortsJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
    
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

    private async Task StartAsync(string addonId, CancellationToken ct)
    {
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (addon?.ContainerId != null)
        {
            try
            {
                await docker.StartContainerAsync(addon.ContainerId);
                await SetStatusAsync(addonId, AddonStatus.Running);
                await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Running);
            }
            catch (DockerContainerNotFoundException)
            {
                logger.LogWarning("Container {Id} not found — cannot start", addonId);
                await SetStatusAsync(addonId, AddonStatus.Error, AddonErrors.ContainerNotFound);
                await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.ContainerNotFound);
            }

        }
        
        await notifier.NotifyPendingTaskChanged(addonId, null);
    }
    
    private async Task StopAsync(string addonId, CancellationToken ct)
    {
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (addon?.ContainerId != null)
        {
            try
            {
                await docker.StopContainerAsync(addon.ContainerId);
                await SetStatusAsync(addonId, AddonStatus.Stopped);
                await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Stopped);
            }
            catch (DockerContainerNotFoundException)
            {
                logger.LogWarning("Container {Id} not found — cannot stop", addonId);
                await SetStatusAsync(addonId, AddonStatus.Error, AddonErrors.ContainerNotFound);
                await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.ContainerNotFound);
            }

        }
        
        await notifier.NotifyPendingTaskChanged(addonId, null);
    }

    private async Task InstallAsync(InstallRequest request, CancellationToken ct)
    {
        var addonId = request.Id;
        var catalogEntry = await db.AddonCatalogEntries.FindAsync([addonId], ct);
        if (catalogEntry == null)
        {
            logger.LogError("Catalog entry not found for addon {Id}", addonId);
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.NotFound);
            await notifier.NotifyPendingTaskChanged(addonId, null);
            return;
        }
        
        try 
        {
            var image = catalogEntry.Image;
            if (!await docker.ImageExistsLocallyAsync(image))
            {
                logger.LogInformation("Pulling image {Image}...", image);
                await docker.PullImageAsync(image);
            }
            
            var portMappings = ParseCatalogPorts(catalogEntry.Ports);
            var containerId = await docker.CreateContainerAsync(new AddonContainerSpec
            {
                Image = image,
                AddonId = addonId,
                ApiUrl = "",
                ClientId = Guid.NewGuid().ToString("N"),
                RedirectUri = "_apiUrl/oauth/{addonId}/callback",
                PortMappings = portMappings,
            });
            
            db.AddonInstallations.Add(new AddonInstallation
            {
                Id = addonId,
                ContainerId = containerId,
                Name = catalogEntry.Name,
                Description = catalogEntry.Description,
                Icon = catalogEntry.Icon,
                Image = image,
                Version = catalogEntry.Version,
                Author = catalogEntry.Author,
                Status = AddonStatus.Installed,
                InstalledAt = DateTime.UtcNow,
                LastStatusChangedAt = DateTime.UtcNow,
            });
            
            await db.SaveChangesAsync(ct);
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Installed);
        }
        catch (DockerImageNotFoundException)
        {
            logger.LogError("Image {Image} not found locally or on registry", catalogEntry.Image);
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.ImageNotFound);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to install addon {Id}", addonId);
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.InstallFailed);
        }
        await notifier.NotifyPendingTaskChanged(addonId, null);
    }

    
    private async Task UninstallAsync(string addonId, CancellationToken ct)
    {
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (addon?.ContainerId != null)
        {
            try
            {
                await docker.StopContainerAsync(addon.ContainerId);
                await docker.RemoveContainerAsync(addon.ContainerId);
            }
            catch (DockerContainerNotFoundException)
            {
                logger.LogWarning("Container {Id} already gone during uninstall", addonId);
            }

            db.AddonInstallations.Remove(addon);
            await db.SaveChangesAsync(ct);
        }

        await notifier.NotifyPendingTaskChanged(addonId, null);
        await notifier.NotifyAddonUninstalled(addonId);
    }
    
    private async Task SetStatusAsync(string addonId, string status, string? errorCode = null)
    {
        if (errorCode != null)
        {
            await db.AddonInstallations
                .Where(a => a.Id == addonId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(a => a.Status, status)
                    .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow)
                    .SetProperty(a => a.PendingTaskId, (string?)null)
                    .SetProperty(a => a.PendingTaskPhase, (string?)null)
                    .SetProperty(a => a.LastErrorCode, errorCode));
        }
        else
        {
            await db.AddonInstallations
                .Where(a => a.Id == addonId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(a => a.Status, status)
                    .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow)
                    .SetProperty(a => a.PendingTaskId, (string?)null)
                    .SetProperty(a => a.PendingTaskPhase, (string?)null));
        }
    }
    
    private static List<PortMapping>? ParseCatalogPorts(string? portsJson)
    {
        if (string.IsNullOrEmpty(portsJson)) return null;
        var ports = JsonSerializer.Deserialize<List<CatalogPortDef>>(portsJson, CatalogPortsJsonOptions);
        return ports?.Select(p => new PortMapping { InternalPort = p.Container }).ToList();
    }
    
    private record CatalogPortDef(int Container, string Protocol);
}