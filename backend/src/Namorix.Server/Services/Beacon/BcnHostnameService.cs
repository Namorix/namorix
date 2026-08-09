using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Beacon.Providers;
using NotificationKeys = Namorix.Server.Constants.NotificationKeys;

namespace Namorix.Server.Services.Beacon;

public sealed class BcnHostnameService(AppDbContext db, BcnProviderResolver resolver,
    BcnSecretProtector protector, IPublicIpDetector ipDetector, NotificationService notifications,
    IBeaconNotifier beaconNotifier)
{
    private const int DefaultIntervalMinutes = 15;
    private const int MaxBackoffMinutes = 60 * 24;

    public record BcnProbeResult(bool Supported, string? Ipv4 = null, string? Ipv6 = null, bool Error = false);

    public async Task<BcnUpdateResult> UpdateHostAsync(BcnHostname host,
        IPAddress? ipv4, IPAddress? ipv6, bool force = false, CancellationToken ct = default)
    {
        var newIpv4 = ipv4?.ToString();
        var newIpv6 = ipv6?.ToString();
        var prevStatus = host.Status;
        var now = DateTime.UtcNow;
        var config =
            JsonSerializer.Deserialize<BcnProviderConfig>(host.ConfigJson, BcnProviderConfig.SerializerOptions) ??
            new BcnProviderConfig();
        var provider = resolver.Resolve(host.ProviderId, config);
        
        try
        {
            protector.Unprotect(config);
        }
        catch (CryptographicException)
        {
            host.Status = BcnHostnameStatus.Error;
            host.LastError = BcnErrorCodes.ConfigInvalid;
            host.CurrentIpv4 = null;
            host.CurrentIpv6 = null;
            
            await LogAndNotifyAsync(BcnLogLevel.Error, BcnErrorCodes.ConfigInvalid, new Dictionary<string, object?>
            {
                [BcnParam.Field] = BcnParam.FieldConfig
            }, host.Id, host.DisplayName);

            if (prevStatus != BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host);
            
            await NotifyStatusChangedAsync(host, prevStatus);
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid);
        }
        
        if (string.IsNullOrWhiteSpace(host.Host))
        {
            return new BcnUpdateResult(false, BcnErrorCodes.ConfigInvalid, new Dictionary<string, object?>
            {
                [BcnParam.Field] = BcnParam.FieldHost
            });
        }

        BcnCurrentRecord? current = null;
        if (!force)
            current = await TryGetCurrentAsync(host.Domain, ct);

        if (!force && host.Status != BcnHostnameStatus.Error)
        {
            var inSync = current?.Matches(newIpv4, newIpv6) ?? host.CurrentIpv4 == newIpv4 && host.CurrentIpv6 == newIpv6;
            var heartbeatDue = await IsHeartbeatDueAsync(db, host, ct);
            if (inSync && !heartbeatDue)
                return new BcnUpdateResult(true);
        }

        BcnUpdateResult result;
        try
        {
            // provider tự split multi-host (host = chuỗi comma đầy đủ, không split ở đây)
            result = await provider.UpdateAsync(host.Host, host.Domain, config, ipv4, ipv6, ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            result = new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
                new Dictionary<string, object?> { [BcnParam.HttpStatus] = 0, [BcnParam.Detail] = ex.Message });
        }

        host.LastCheckedAt = now;
        if (result.Success)
        {
            host.Status = BcnHostnameStatus.Active;
            host.CurrentIpv4 = newIpv4;
            host.CurrentIpv6 = newIpv6;
            host.LastUpdatedAt = now;
            host.LastError = null;
            host.BackoffUntil = null;
            await LogAndNotifyAsync(BcnLogLevel.Success, BcnActivityCodes.Updated,
                new Dictionary<string, object?> { [BcnParam.Ip] = newIpv4, [BcnParam.Ipv6] = newIpv6 },
                host.Id, host.DisplayName);
            if (prevStatus == BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host, recovered: true);
        }
        else if (result.RateLimited)
        {
            host.BackoffUntil = result.RetryAfter?.UtcDateTime ?? now.AddMinutes(ComputeBackoff(host, now));
            if (host.Status == BcnHostnameStatus.Updating)
                host.Status = BcnHostnameStatus.Active;
            await LogAndNotifyAsync(BcnLogLevel.Warn, BcnErrorCodes.RateLimited,
                new Dictionary<string, object?> { [BcnParam.RetryAt] = host.BackoffUntil?.ToString("O") },
                host.Id, host.DisplayName);
        }
        else
        {
            host.Status = BcnHostnameStatus.Error;
            host.LastError = result.Code ?? BcnErrorCodes.ProviderError;
            host.CurrentIpv4 = null;
            host.CurrentIpv6 = null;

            var logParams = result.Params is null ? null : WithProvider(result.Params, host.ProviderId);
            await LogAndNotifyAsync(BcnLogLevel.Error, result.Code, logParams, host.Id, host.DisplayName);

            if (prevStatus != BcnHostnameStatus.Error)
                await NotifyHostnameAsync(host, DescribeDetail(result));
        }

        await NotifyStatusChangedAsync(host, prevStatus);
        return result;
    }
    
    public async Task<BcnUpdateResult> UpdateHostWithDetectedIpAsync(BcnHostname host,
        bool force = false, CancellationToken ct = default)
    {
        var settings = await db.BcnSettings.FirstOrDefaultAsync(cancellationToken: ct);
        var ip = await ipDetector.DetectAsync(
            settings?.IpDetectionService ?? PublicIpServices.Auto,
            settings?.UpdateIpv6 ?? false, ct);
        var prevStatus = host.Status;

        if (ip.HasAny)
            return await UpdateHostAsync(host, ip.IPv4, ip.IPv6, force, ct);
        
        host.Status = BcnHostnameStatus.Error;
        host.LastError = BcnErrorCodes.NoIp;
        host.LastCheckedAt = DateTime.UtcNow;
        host.CurrentIpv4 = null;
        host.CurrentIpv6 = null;
        
        await LogAndNotifyAsync(BcnLogLevel.Error, BcnErrorCodes.NoIp,
            null, host.Id, host.DisplayName);
        await NotifyStatusChangedAsync(host, prevStatus);
        return new BcnUpdateResult(false, BcnErrorCodes.NoIp);
    }
    
    public async Task<BcnProbeResult> RefreshHostFromProviderAsync(BcnHostname host, CancellationToken ct)
    {
        var config = JsonSerializer.Deserialize<BcnProviderConfig>(host.ConfigJson,
            BcnProviderConfig.SerializerOptions) ?? new BcnProviderConfig();

        try
        {
            protector.Unprotect(config);
        }
        catch (CryptographicException)
        {
            return new BcnProbeResult(false);
        }

        try
        {
            var current = await AuthoritativeDnsResolver.ResolveAsync(host.Domain, ct);
            if (current is null)
                return new BcnProbeResult(true, Error: true);

            var now = DateTime.UtcNow;
            var changed = host.CurrentIpv4 != current.Ipv4 || host.CurrentIpv6 != current.Ipv6;
            host.CurrentIpv4 = current.Ipv4;
            host.CurrentIpv6 = current.Ipv6;
            host.LastCheckedAt = now;

            if (changed)
            {
                await LogAndNotifyAsync(BcnLogLevel.Info, BcnActivityCodes.Probed,
                    new Dictionary<string, object?> { [BcnParam.Ip] = current.Ipv4, [BcnParam.Ipv6] = current.Ipv6 },
                    host.Id, host.DisplayName);
            }
            
            return new BcnProbeResult(true, current.Ipv4, current.Ipv6);
        }
        catch
        {
            return new BcnProbeResult(true, Error: true);
        }
    }
    
    private static string? DescribeDetail(BcnUpdateResult result)
    {
        var p = result.Params;
        if (p is null) return null;
        if (p.TryGetValue(BcnParam.Detail, out var d) && d is not null) return d.ToString();
        if (p.TryGetValue(BcnParam.HttpStatus, out var s) && s is int st and > 0) return $"HTTP {st}";
        if (p.TryGetValue(BcnParam.Reason, out var r) && r is not null) return r.ToString();
        return null;
    }


    private static int ComputeBackoff(BcnHostname host, DateTime now)
    {
        if (host.BackoffUntil is not { } until || host.LastCheckedAt is not { } lastChecked)
            return DefaultIntervalMinutes;

        var prev = (until - lastChecked).TotalMinutes;
        if (prev > 0)
            return (int)Math.Min(prev * 2, MaxBackoffMinutes);
        
        return DefaultIntervalMinutes;
    }
    
    private static async Task<BcnCurrentRecord?> TryGetCurrentAsync(string domain, CancellationToken ct)
    {
        try
        {
            return await AuthoritativeDnsResolver.ResolveAsync(domain, ct);
        }
        catch
        {
            return null;
        }
    }
    
    private static async Task<bool> IsHeartbeatDueAsync(AppDbContext db, BcnHostname host, CancellationToken ct)
    {
        var hours = await db.BcnSettings.Select(s => s.HeartbeatIntervalHours).FirstOrDefaultAsync(ct);

        if (hours < 1)
            hours = 1;
        if (host.LastUpdatedAt is not { } last)
            return true;
        
        return DateTime.UtcNow - last >= TimeSpan.FromHours(hours);
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

    private Task NotifyHostnameAsync(BcnHostname host, string? detail = null, bool recovered = false) =>
        recovered
            ? notifications.CreateForAdminsAsync(NotificationType.Success, NotificationKeys.Beacon.BeaconHostnameRecovered,
                AddonSourceId.Beacon, new { hostname = host.DisplayName })
            : notifications.CreateForAdminsAsync(NotificationType.Error, NotificationKeys.Beacon.BeaconHostnameError,
                AddonSourceId.Beacon, new
                {
                    hostname = host.DisplayName, provider = host.ProviderId, error = host.LastError, detail
                });
    
    private Task NotifyStatusChangedAsync(BcnHostname host, BcnHostnameStatus prevStatus) =>
        host.Status == prevStatus
            ? Task.CompletedTask
            : beaconNotifier.NotifyHostnameStatusChanged(host.Id, host.DisplayName,
                host.Status);
    
    private async Task<BcnActivityLog> LogAndNotifyAsync(BcnLogLevel level, string? code,
        Dictionary<string, object?>? @params, string? hostnameId, string? hostname)
    {
        var log = Log(level, code, @params, hostnameId);
        db.BcnActivityLogs.Add(log);
        await db.SaveChangesAsync();
        await beaconNotifier.NotifyActivityCreated(log, hostname);
        return log;
    }
    
    private static Dictionary<string, object?>? WithProvider(Dictionary<string, object?>? p, string providerId)
    {
        var dict = new Dictionary<string, object?>(p ?? new Dictionary<string, object?>());
        dict.TryAdd(BcnParam.Provider, providerId);
        return dict;
    }
}