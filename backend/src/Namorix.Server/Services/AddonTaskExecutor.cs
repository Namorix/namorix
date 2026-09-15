using System.Security.Cryptography;
using System.Text.Json;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Models;
using Namorix.Server.Config;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Models.Addon;
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
                await UpdateAsync(task.AddonId, ct);
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
            var (containerId, registrationToken) = await PullAndCreateAsync(catalogEntry, addonId);

            db.AddonInstallations.Add(new AddonInstallation
            {
                Id = addonId,
                ContainerId = containerId,
                Image = catalogEntry.Image,
                Version = catalogEntry.Version,
                HostPort = GetEntryPort(catalogEntry.Ports) ?? 0,
                Ports = catalogEntry.Ports,
                Status = AddonStatus.Installed,
                InstalledAt = DateTime.UtcNow,
                LastStatusChangedAt = DateTime.UtcNow,
            });

            db.OAuthRegistrations.Add(NewRegistration(addonId, registrationToken));

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

    private async Task UpdateAsync(string addonId, CancellationToken ct)
    {
        var catalogEntry = await db.AddonCatalogEntries.FindAsync([addonId], ct);
        var addon = await db.AddonInstallations.FindAsync([addonId], ct);
        if (catalogEntry == null || addon == null)
        {
            logger.LogError("Catalog entry or installation missing for addon {Id}", addonId);
            await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, AddonErrors.NotFound);
            await notifier.NotifyPendingTaskChanged(addonId, null);
            return;
        }

        // The container is force-removed, so an addon the user was running comes back down
        // whether we like it or not - bring it up again rather than leave it stopped.
        var wasRunning = addon.Status == AddonStatus.Running;

        try
        {
            // The old container is what holds the channel, so it is already doomed; close it
            // here instead of letting the receive loop discover the corpse.
            channelManager.DisconnectAsync(addonId);

            var (containerId, registrationToken) = await PullAndCreateAsync(catalogEntry, addonId);

            addon.ContainerId = containerId;
            addon.Image = catalogEntry.Image;
            addon.Version = catalogEntry.Version;
            addon.HostPort = GetEntryPort(catalogEntry.Ports) ?? 0;
            addon.Ports = catalogEntry.Ports;
            addon.Status = wasRunning ? AddonStatus.Running : AddonStatus.Installed;
            addon.LastErrorCode = null;
            addon.LastStatusChangedAt = DateTime.UtcNow;
            addon.PendingTaskId = null;
            addon.PendingTaskPhase = null;
            // ClientId, PublicKey, RedirectUri and Scope are the addon's OAuth identity. The
            // new container has to inherit the grants the old one held; wiping them would
            // log every user out of an addon they only asked to update.

            var staleRegistrations = await db.OAuthRegistrations
                .Where(r => r.AddonInstallationId == addonId).ToListAsync(ct);
            db.OAuthRegistrations.RemoveRange(staleRegistrations);
            db.OAuthRegistrations.Add(NewRegistration(addonId, registrationToken));

            await db.SaveChangesAsync(ct);

            if (wasRunning)
                await docker.StartContainerAsync(containerId);

            await notifier.NotifyAddonUpdated(addonId);
        }
        catch (DockerImageNotFoundException)
        {
            await FailUpdateAsync(addonId, AddonErrors.ImageNotFound,
                $"Image {catalogEntry.Image} not found locally or on registry");
        }
        catch (Exception ex)
        {
            await FailUpdateAsync(addonId, AddonErrors.UpdateFailed, "Failed to update addon", ex);
        }
        await notifier.NotifyPendingTaskChanged(addonId, null);
    }

    // Update failures go through ExecuteUpdate rather than the tracked entity: the context
    // may be sitting on a half-applied change when this runs, and the pending phase has to
    // be cleared or the card spins again on the next panel load.
    private async Task FailUpdateAsync(string addonId, string errorCode, string message, Exception? ex = null)
    {
        if (ex is null)
            logger.LogError("{Message} for addon {Id}", message, addonId);
        else
            logger.LogError(ex, "{Message} {Id}", message, addonId);

        await db.AddonInstallations
            .Where(a => a.Id == addonId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, AddonStatus.Error)
                .SetProperty(a => a.LastErrorCode, errorCode)
                .SetProperty(a => a.PendingTaskId, (string?)null)
                .SetProperty(a => a.PendingTaskPhase, (string?)null)
                .SetProperty(a => a.LastStatusChangedAt, DateTime.UtcNow));

        await notifier.NotifyAddonStatusChanged(addonId, AddonStatus.Error, errorCode);
    }

    // Install and update differ only in what they write afterwards: both swap the running
    // container for whatever the catalog currently points at.
    private async Task<(string ContainerId, string RegistrationToken)> PullAndCreateAsync(
        AddonCatalogEntry catalogEntry, string addonId)
    {
        // Always pull: the catalog tags addons as :latest, so a locally cached image
        // would otherwise shadow a newly published build. Docker compares digests and
        // only downloads layers when the tag actually moved.
        logger.LogInformation("Pulling image {Image}...", catalogEntry.Image);
        await docker.PullImageAsync(catalogEntry.Image);

        var registrationToken = Guid.NewGuid().ToString("N");

        var cfg = backendConfig.Value;
        await docker.RemoveContainerIfExistsAsync(addonId);
        var containerId = await docker.CreateContainerAsync(new AddonContainerSpec
        {
            Image = catalogEntry.Image,
            AddonId = addonId,
            DesktopApiUrl = $"http://127.0.0.1:{cfg.Port}",
            DesktopGrpcUrl = $"http://127.0.0.1:{cfg.GrpcPort}",
            RegistrationToken = registrationToken,
        });

        return (containerId, registrationToken);
    }

    private OAuthRegistration NewRegistration(string addonId, string token) => new()
    {
        Token = token,
        AddonInstallationId = addonId,
        ExpiresAt = DateTime.UtcNow.AddMinutes(backendConfig.Value.RegistrationTokenTtlMinutes),
        Used = false,
    };


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

    private static int? GetEntryPort(string? portsJson)
    {
        var ports = PortDeserializeJson(portsJson);
        return ports?.FirstOrDefault(p => p.Entry)?.Container
               ?? ports?.FirstOrDefault()?.Container;
    }
    
    private record CatalogPortDef(int Container, string Protocol, string? Description, bool Entry = false);
}