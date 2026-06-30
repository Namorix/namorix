using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Models;
using Namorix.Server.Models.Catalog;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class CatalogService(HttpClient httpClient, ILogger<CatalogService> logger)
{
    public async Task SyncCatalogAsync(string catalogUrl, int ttlSeconds, AppDbContext db,
        CancellationToken ct, bool forceSync = false)
    {
        logger.LogInformation("Syncing addon catalog from {Url}", catalogUrl);

        CatalogIndex? index;
        try
        {
            var json = await httpClient.GetStringAsync(catalogUrl, ct);
            index = JsonSerializer.Deserialize<CatalogIndex>(json);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch catalog index from {Url}", catalogUrl);
            return;
        }

        if (index?.Addons == null || index.Addons.Count == 0)
        {
            logger.LogWarning("Catalog index is empty");
            return;
        }

        var effectiveTtl = index.Ttl > 0 ? index.Ttl : ttlSeconds;
        var cutoff = DateTime.UtcNow.AddSeconds(-effectiveTtl);
        var existingIds = (await db.AddonCatalogEntries.Select(e => e.Id)
            .ToListAsync(ct)).ToHashSet();
        var fetchedIds = new HashSet<string>();

        foreach (var entry in index.Addons)
        {
            fetchedIds.Add(entry.Id);

            // Skip if still fresh
            var existing = await db.AddonCatalogEntries.FindAsync([entry.Id], ct);
            if (existing != null && !forceSync && existing.CachedAt >= cutoff)
                continue;
            
            try
            {
                var manifestJson = await httpClient.GetStringAsync(entry.ManifestUrl, ct);
                var manifest = JsonSerializer.Deserialize<AddonManifestDto>(manifestJson);
                if (manifest == null) continue;

                if (existing != null)
                    UpdateEntry(existing, manifest, entry.ManifestUrl);
                else
                    db.AddonCatalogEntries.Add(MapToEntry(manifest, entry.ManifestUrl));
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to fetch manifest for {Id} from {Url}", entry.Id, entry.ManifestUrl);
            }
        }

        // Mark orphans (entries no longer in the index)
        foreach (var existingId in existingIds.Where(existingId => !fetchedIds.Contains(existingId)))
        {
            var orphan = await db.AddonCatalogEntries.FindAsync([existingId], ct);
            if (orphan != null)
                orphan.IsOrphaned = true;
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Catalog sync complete: {Count} entries", fetchedIds.Count);
    }

    private static AddonCatalogEntry MapToEntry(AddonManifestDto dto, string manifestUrl)
    {
        return new AddonCatalogEntry
        {
            Id = dto.Id,
            Name = dto.Name,
            Description = dto.Description,
            Version = dto.Version,
            Author = dto.Author,
            Category = dto.Category,
            Icon = dto.Icon,
            Repo = dto.Repo,
            License = dto.License,
            Image = dto.Image,
            ImageTag = dto.ImageTag,
            Arch = dto.Arch != null ? JsonSerializer.Serialize(dto.Arch) : null,
            Ports = dto.Ports != null ? JsonSerializer.Serialize(dto.Ports) : null,
            Boot = dto.Boot,
            MinCoreVersion = dto.MinCoreVersion,
            MinServerVersion = dto.MinServerVersion,
            ManifestUrl = manifestUrl,
            CachedAt = DateTime.UtcNow,
            IsOrphaned = false,
        };
    }

    private static void UpdateEntry(AddonCatalogEntry existing, AddonManifestDto dto, string manifestUrl)
    {
        existing.CachedAt = DateTime.UtcNow;
        existing.IsOrphaned = false;
        existing.ManifestUrl = manifestUrl;

        existing.Name = dto.Name;
        existing.Description = dto.Description;
        existing.Version = dto.Version;
        existing.Author = dto.Author;
        existing.Category = dto.Category;
        existing.Icon = dto.Icon;
        existing.Repo = dto.Repo;
        existing.License = dto.License;
        existing.Image = dto.Image;
        existing.ImageTag = dto.ImageTag;
        existing.Arch = dto.Arch != null ? JsonSerializer.Serialize(dto.Arch) : null;
        existing.Ports = dto.Ports != null ? JsonSerializer.Serialize(dto.Ports) : null;
        existing.Boot = dto.Boot;
        existing.MinCoreVersion = dto.MinCoreVersion;
        existing.MinServerVersion = dto.MinServerVersion;
    }
}