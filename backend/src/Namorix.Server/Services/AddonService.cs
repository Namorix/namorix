using Microsoft.EntityFrameworkCore;
using Namorix.Core.Config;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonService(AppDbContext appDbContext, IAddonNotifier notifier)
{
    public async Task<List<AddonInstallationDto>> GetInstalledAddonsAsync()
    {
        return await (
                from inst in appDbContext.AddonInstallations
                join cat in appDbContext.AddonCatalogEntries on inst.Id equals cat.Id into catJoin
                from cat in catJoin.DefaultIfEmpty()
                orderby cat.Name ?? inst.Id
                select new AddonInstallationDto
                {
                    Id = inst.Id,
                    ContainerId = inst.ContainerId,
                    Name = cat.Name ?? inst.Id,
                    Description = cat.Description,
                    Icon = cat.Icon,
                    Image = inst.Image,
                    HostPort = inst.HostPort,
                    Ports = inst.Ports,
                    Status = inst.Status ?? "unknown",
                    Version = inst.Version,
                    Author = cat.Author,
                    PendingTaskId = inst.PendingTaskId,
                    PendingTaskPhase = inst.PendingTaskPhase,
                    LastErrorCode = inst.LastErrorCode,
                    InstalledAt = inst.InstalledAt,
                })
            .ToListAsync();
    }

    public async Task<List<AddonCatalogEntry>> GetCatalogAsync()
    {
        return await appDbContext.AddonCatalogEntries
            .Where(e => !e.IsOrphaned)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }
    
    public async Task<List<AddonCatalogEntry>> RefreshCatalogAsync(
        CatalogService catalog, AddonCatalogConfig config)
    {
        await catalog.SyncCatalogAsync(
            config.CatalogUrl, config.TtlSeconds, appDbContext, CancellationToken.None, true);
        return await appDbContext.AddonCatalogEntries
            .Where(e => !e.IsOrphaned)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }
    
    public async Task SetTaskPending(string addonId, string pendingStatus)
    {
        await notifier.NotifyPendingTaskChanged(addonId, pendingStatus);
        await appDbContext.AddonInstallations
            .Where(a => a.Id == addonId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.PendingTaskId, Guid.NewGuid().ToString("N"))
                .SetProperty(a => a.PendingTaskPhase, pendingStatus));
    }
}

public class InstallRequest
{
    public string Id { get; init; } = string.Empty;
}

public class AddonInstallationDto
{
    public string Id { get; init; } = string.Empty;
    public string? ContainerId { get; set; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public string Image { get; init; } = string.Empty;
    public int HostPort { get; set; }
    public string? Ports { get; set; }
    public string Status { get; set; } = "unknown";
    public string? Version { get; init; }
    public string? Author { get; init; }
    public string? PendingTaskId { get; init; }
    public string? PendingTaskPhase { get; init; }
    public string? LastErrorCode { get; init; }
    public DateTime InstalledAt { get; init; }
}