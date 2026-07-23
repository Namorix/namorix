using System.Security.Cryptography;
using System.Text.Json;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
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
    AddonChannelManager channelManager,
    IOptions<BackendConfig> backendConfig,
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
                
                var changed = await SetStatusAsync(addonId, AddonStatus.Running);
                if (changed > 0)
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
        channelManager.DisconnectAsync(addonId);

        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (addon?.ContainerId != null)
        {
            try
            {
                await docker.StopContainerAsync(addon.ContainerId);

                var changed = await SetStatusAsync(addonId, AddonStatus.Stopped);
                if (changed > 0)
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
            
            var registrationToken = Guid.NewGuid().ToString("N");

            var cfg = backendConfig.Value;
            var backendInContainer = DockerService.IsRunningInContainer();
            var apiUrl = backendInContainer
                ? $"http://{cfg.ContainerName}:{cfg.Port}"
                : $"http://host.docker.internal:{cfg.Port}";
            
            if (backendInContainer)
                await docker.EnsureNetworkExistsAsync(cfg.NetworkName);
            
            var portMappings = ParseCatalogPorts(catalogEntry.Ports);
            await docker.RemoveContainerIfExistsAsync(addonId);
            var containerId = await docker.CreateContainerAsync(new AddonContainerSpec
            {
                Image = image,
                AddonId = addonId,
                ApiUrl = apiUrl,
                RegistrationToken = registrationToken,
                PortMappings = portMappings,
                ExtraHosts = backendInContainer ? null : ["host.docker.internal:host-gateway"],
                NetworkName = backendInContainer ? cfg.NetworkName : null,
            });

            var entryPort = GetEntryPort(catalogEntry.Ports) ?? 0;
            
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
                HostPort = entryPort,
                Ports = catalogEntry.Ports,
                Status = AddonStatus.Installed,
                InstalledAt = DateTime.UtcNow,
                LastStatusChangedAt = DateTime.UtcNow,
            });
            
            db.OAuthRegistrations.Add(new OAuthRegistration
            {
                Token = registrationToken,
                AddonInstallationId = addonId,
                ExpiresAt = DateTime.UtcNow.AddMinutes(cfg.RegistrationTokenTtlMinutes),
                Used = false,
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
        channelManager.DisconnectAsync(addonId);
        
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
            
            var regs = await db.OAuthRegistrations
                .Where(r => r.AddonInstallationId == addonId).ToListAsync(ct);
            db.OAuthRegistrations.RemoveRange(regs);
            
            if (addon.ClientId != null)
            {
                var tokens = await db.OAuthTokens
                    .Where(t => t.ClientId == addon.ClientId).ToListAsync(ct);
                db.OAuthTokens.RemoveRange(tokens);
            }
            
            db.AddonInstallations.Remove(addon);
            await db.SaveChangesAsync(ct);
        }

        await notifier.NotifyPendingTaskChanged(addonId, null);
        await notifier.NotifyAddonUninstalled(addonId);
    }
    
    private async Task<int> SetStatusAsync(string addonId, string status, string? errorCode = null)
    {
        if (errorCode != null)
        {
            return await db.AddonInstallations
                .Where(a => a.Id == addonId && a.Status != status)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(a => a.Status, status)
                    .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow)
                    .SetProperty(a => a.PendingTaskId, (string?)null)
                    .SetProperty(a => a.PendingTaskPhase, (string?)null)
                    .SetProperty(a => a.LastErrorCode, errorCode));
        }
        else
        {
            return await db.AddonInstallations
                .Where(a => a.Id == addonId && a.Status != status)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(a => a.Status, status)
                    .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow)
                    .SetProperty(a => a.PendingTaskId, (string?)null)
                    .SetProperty(a => a.PendingTaskPhase, (string?)null));
        }
    }

    private static List<CatalogPortDef>? PortDeserializeJson(string? portsJson)
    {
        return string.IsNullOrEmpty(portsJson)
            ? null
            : JsonSerializer.Deserialize<List<CatalogPortDef>>(portsJson, CatalogPortsJsonOptions);
    }
    
    private static List<PortMapping>? ParseCatalogPorts(string? portsJson)
    {
        var ports = PortDeserializeJson(portsJson);
        return ports?.Select(p => new PortMapping {
            InternalPort = p.Container,
            HostPort = p.Container,
        }).ToList();
    }

    private static int? GetEntryPort(string? portsJson)
    {
        var ports = PortDeserializeJson(portsJson);
        return ports?.FirstOrDefault(p => p.Entry)?.Container
               ?? ports?.FirstOrDefault()?.Container;
    }
    
    private record CatalogPortDef(int Container, string Protocol, string? Description, bool Entry = false);
}