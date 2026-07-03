using Microsoft.EntityFrameworkCore;
using Namorix.Core.Config;
using Namorix.Core.Models;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class AddonService(AppDbContext appDbContext, IAddonNotifier notifier)
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