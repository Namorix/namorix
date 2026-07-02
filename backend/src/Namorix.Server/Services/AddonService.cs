using Microsoft.EntityFrameworkCore;
using Namorix.Core.Config;
using Namorix.Core.Models;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonService(AppDbContext appDbContext)
{
    public async Task<List<AddonInstallation>> GetInstalledAddonsAsync()
    {
        return await appDbContext.AddonInstallations.OrderBy(a => a.Name).ToListAsync();
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
    
    public async Task SetTaskPending(string addonId, string status)
    {
        await appDbContext.AddonInstallations
            .Where(a => a.Id == addonId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.PendingTaskId, Guid.NewGuid().ToString("N"))
                .SetProperty(a => a.Status, status));
    }
}

public class InstallRequest
{
    public string Image { get; init; } = string.Empty;
    public int ContainerPort { get; init; } = 80;
    public int HostPort { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public string? Version { get; init; }
    public string? Author { get; init; }
}