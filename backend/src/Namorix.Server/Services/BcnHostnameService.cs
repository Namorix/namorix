using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Namorix.Server.Services.BcnProviders;

namespace Namorix.Server.Services;

public sealed class BcnHostnameService(AppDbContext db, BcnProviderResolver resolver,
    BcnSecretProtector protector, NotificationService notifications)
{
    private const int DefaultIntervalMinutes = 15;
    private const int MaxBackoffMinutes = 60 * 24;

    public async Task<BcnUpdateResult> UpdateHostAsync(BcnHostname host,
        IPAddress? ipv4, IPAddress? ipv6, bool force = false, CancellationToken ct = default)
    {
        var newIpv4 = ipv4?.ToString();
        var newIpv6 = ipv6?.ToString();
        if (!force && host.CurrentIpv4 == newIpv4 && host.CurrentIpv6 == newIpv6)
            return new BcnUpdateResult(true);   // IP unchanged → skip (chỉ path scheduled; manual force luôn chạy)

        var prevStatus = host.Status;
        var now = DateTime.UtcNow;
        var config =
            JsonSerializer.Deserialize<BcnProviderConfig>(host.ConfigJson, BcnProviderConfig.SerializerOptions) ??
            new BcnProviderConfig();
        
        try
        {
            protector.Unprotect(config);
        }
        catch (CryptographicException)
        {
            host.Status = BcnHostnameStatus.Error;
            host.LastError = BcnErrorCodes.ConfigInvalid;   // Corrupted config → không abort loop
            if (prevStatus != BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host);
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid);
        }

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
                new Dictionary<string, object?>
                {
                    ["ip"] = newIpv4, ["ipv6"] = newIpv6
                }, host.Id));

            if (prevStatus == BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host, recovered: true);
        }
        else if (result.RateLimited)
        {
            host.BackoffUntil = result.RetryAfter?.UtcDateTime ?? now.AddMinutes(ComputeBackoff(host, now));
            db.BcnActivityLogs.Add(Log(BcnLogLevel.Warn, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?>
                {
                    ["retryAt"] = host.BackoffUntil?.ToString("O")
                }, host.Id));
        }
        else
        {
            host.Status = BcnHostnameStatus.Error;
            host.LastError = DescribeError(result);
            db.BcnActivityLogs.Add(Log(BcnLogLevel.Error, result.Code,
                result.Params, host.Id));

            if (prevStatus != BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host);
        }

        return result;
    }

    private static string DescribeError(BcnUpdateResult result) =>
        result.Params?.TryGetValue("httpStatus", out var s) == true
            ? $"{result.Code} (HTTP {s})"
            : result.Code ?? BcnErrorCodes.ProviderError;

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

    private Task NotifyHostnameAsync(BcnHostname host, bool recovered = false) =>
        recovered
            ? notifications.CreateForAdminsAsync("success", "beacon:hostnameRecovered", "beacon",
                new { hostname = host.Hostname })
            : notifications.CreateForAdminsAsync("error", "beacon:hostnameError", "beacon",
                new { hostname = host.Hostname, error = host.LastError });
}