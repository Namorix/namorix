using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Namorix.Server.Services.BcnProviders;

namespace Namorix.Server.Workers;

public sealed class BcnCheckWorker(IServiceScopeFactory scopeFactory,
    IPublicIpDetector ipDetector, BcnProviderResolver resolver,
    ILogger<BcnCheckWorker> logger) : BackgroundService
{
    private const int DefaultIntervalMinutes = 15;
    private const int MaxBackoffMinutes = 60 * 24;

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
            await UpdateHostAsync(db, host, ip.IPv4, ip.IPv6, ct);

        await db.SaveChangesAsync(ct);
    }

    private async Task UpdateHostAsync(AppDbContext db, BcnHostname host,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        var newIpv4 = ipv4?.ToString();
        var newIpv6 = ipv6?.ToString();
        if (host.CurrentIpv4 == newIpv4 && host.CurrentIpv6 == newIpv6)
            return;   // IP unchanged → skip

        var now = DateTime.UtcNow;
        var config = JsonSerializer.Deserialize<BcnProviderConfig>(host.ConfigJson) ?? new BcnProviderConfig();
        var result = await resolver.Resolve(host.ProviderId, config)
            .UpdateAsync(host.Hostname, config, ipv4, ipv6, ct);

        host.LastCheckedAt = now;
        if (result.Success)
        {
            host.Status = BcnHostnameStatus.Active;
            host.CurrentIpv4 = newIpv4;
            host.CurrentIpv6 = newIpv6;
            host.LastUpdatedAt = now;
            host.LastError = null;
            host.BackoffUntil = null;
            db.BcnActivityLogs.Add(Log(BcnLogLevel.Info, BcnActivityCodes.Updated,
                new Dictionary<string, object?> { ["ip"] = newIpv4 }, host.Id));
        }
        else if (result.RateLimited)
        {
            host.BackoffUntil = result.RetryAfter?.UtcDateTime ?? now.AddMinutes(ComputeBackoff(host, now));
            db.BcnActivityLogs.Add(Log(BcnLogLevel.Warn, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { ["retryAt"] = host.BackoffUntil?.ToString("O") }, host.Id));
        }
        else
        {
            host.Status = BcnHostnameStatus.Error;
            host.LastError = DescribeError(result);
            db.BcnActivityLogs.Add(Log(BcnLogLevel.Error, result.Code,
                result.Params, host.Id));
        }
    }

    private static string DescribeError(BcnUpdateResult result) =>
        result.Params?.TryGetValue("httpStatus", out var s) == true
            ? $"{result.Code} (HTTP {s})"
            : result.Code ?? "BCN_PROVIDER_ERROR";

    private static int ComputeBackoff(BcnHostname host, DateTime now)
    {
        if (host.BackoffUntil is not { } until || host.LastCheckedAt is not { } lastChecked)
            return DefaultIntervalMinutes;
        
        var prev = (until - lastChecked).TotalMinutes;
        if (prev > 0) return (int)Math.Min(prev * 2, MaxBackoffMinutes);
        return DefaultIntervalMinutes;
    }

    private static BcnActivityLog Log(BcnLogLevel level, string? code,
        Dictionary<string, object?>? @params, string? hostnameId) =>
        new()
        {
            Level = level,
            Code = code,
            ParamsJson = @params is null ? null : JsonSerializer.Serialize(@params),
            HostnameId = hostnameId,
        };

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