using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Server.Persistence;
using Namorix.Server.Services;

namespace Namorix.Server.Workers;

public class CatalogSyncWorker(
    IServiceProvider serviceProvider,
    ILogger<CatalogSyncWorker> logger,
    IOptions<AddonCatalogConfig> config)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var cfg = config.Value;
        if (string.IsNullOrEmpty(cfg.CatalogUrl))
        {
            logger.LogWarning("AddonCatalog:CatalogUrl not configured — catalog sync disabled");
            return;
        }

        logger.LogInformation("CatalogSyncWorker started (interval: {Interval}s, url: {Url})",
            cfg.SyncIntervalSeconds, cfg.CatalogUrl);

        while (!ct.IsCancellationRequested)
        {
            var delay = cfg.SyncIntervalSeconds;
            try
            {
                using var scope = serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var catalog = scope.ServiceProvider.GetRequiredService<CatalogService>();
                await catalog.SyncCatalogAsync(cfg.CatalogUrl, cfg.TtlSeconds, db, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Catalog sync failed");
                delay = cfg.RetryDelaySeconds;
            }
            await Task.Delay(TimeSpan.FromSeconds(delay), ct);
        }
    }
}