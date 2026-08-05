using Microsoft.EntityFrameworkCore;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Namorix.Server.Services;

namespace Namorix.Server.Workers;

public sealed class BcnCheckWorker(IServiceScopeFactory scopeFactory,
    IPublicIpDetector ipDetector, ILogger<BcnCheckWorker> logger) : BackgroundService
{
    private const int DefaultIntervalMinutes = 15;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await RunCheckAsync(ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Beacon check failed");
            }
            await Task.Delay(await GetNextIntervalAsync(ct), ct);
        }
    }

    private async Task RunCheckAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updater = scope.ServiceProvider.GetRequiredService<BcnHostnameService>();

        var settings = await GetSettingsAsync(db, ct);
        var ip = await ipDetector.DetectAsync(settings.IpDetectionService, settings.UpdateIpv6, ct);

        if (!ip.HasAny)
        {
            logger.LogInformation("Public IP detection failed — skipping check");
            return;  // Avoid spammy logs
        }

        var hosts = await db.BcnHostnames
            .Where(h => h.Status != BcnHostnameStatus.Disabled
                        && (h.BackoffUntil == null || h.BackoffUntil <= DateTime.UtcNow))
            .ToListAsync(ct);

        foreach (var host in hosts)
            await updater.UpdateHostAsync(host, ip.IPv4, ip.IPv6, ct: ct);

        await db.SaveChangesAsync(ct);
    }

    private async Task<TimeSpan> GetNextIntervalAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var settings = await db.BcnSettings.FirstOrDefaultAsync(ct);
            return TimeSpan.FromMinutes(settings?.CheckIntervalMinutes ?? DefaultIntervalMinutes);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read Beacon settings");
            return TimeSpan.FromMinutes(DefaultIntervalMinutes);
        }
    }

    private static async Task<BcnSettings> GetSettingsAsync(AppDbContext db, CancellationToken ct)
    {
        var settings = await db.BcnSettings.FirstOrDefaultAsync(ct);
        if (settings is null)
        {
            settings = new BcnSettings();
            db.BcnSettings.Add(settings);
            await db.SaveChangesAsync(ct);
        }
        return settings;
    }
}