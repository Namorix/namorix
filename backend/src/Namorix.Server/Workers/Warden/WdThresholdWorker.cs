using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Models.Warden;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Warden;

namespace Namorix.Server.Workers.Warden;

public class WdThresholdWorker(IServiceProvider services, ILogger<WdThresholdWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await RunOnceAsync(stoppingToken);
        }
        catch (OperationCanceledException) { logger.LogInformation("Warden threshold worker stopping"); }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        try
        {
            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var firewall = scope.ServiceProvider.GetRequiredService<WdFirewallService>();
            var now = DateTime.UtcNow;

            var settings = await db.WdSettings.FirstOrDefaultAsync(ct) ?? new WdSettings();
            var (thresholdFactor, durationFactor) = WdThresholdFactors.For(settings.Profile, settings);
            
            // Load events based on the maximum lookback (SCAN_404 = 60 minutes), then filter + group by each type's lookback
            var events = await db.WdSecurityEvents
                .Where(e => e.Timestamp >= now.AddMinutes(-60))
                .ToListAsync(ct);

            var groups = events
                .Where(e => e.Timestamp >= now.AddMinutes(-WdThresholdRules
                    .For(e.EventType, thresholdFactor, durationFactor).Lookback.TotalMinutes))
                .GroupBy(e => (e.SourceIp, e.EventType))
                .Select(g => (Ip: g.Key.SourceIp, Type: g.Key.EventType, Count: g.Count()));

            
            foreach (var g in groups)
            {
                if (string.IsNullOrEmpty(g.Ip))
                    continue;

                var (threshold, _, duration) = WdThresholdRules.For(g.Type, thresholdFactor, durationFactor);
                if (g.Count <= threshold)
                    continue;
                
                await BanAsync(db, firewall, g.Ip, g.Type, duration, ct);
            }
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Warden threshold iteration failed");
        }
    }

    private async Task BanAsync(AppDbContext db, WdFirewallService firewall,
        string ip, string eventType, TimeSpan? duration, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Auto-ban is already active for this IP → skip (WdErrorCodes.IpAlreadyBanned)
        var active = await db.WdFirewallRules.AnyAsync(r =>
            r.Auto && r.Enabled && r.SourceCidr == ip && (r.ExpiresAt == null || r.ExpiresAt > now), ct);
        if (active) return;

        // Escalation: repeat offense within 24h of self-expiration → permanent ban
        if (duration is not null)
        {
            var recidivist = await db.WdFirewallRules.AnyAsync(r =>
                r.Auto && r.SourceCidr == ip && !r.Enabled &&
                r.ExpiresAt != null && r.ExpiresAt < now && r.ExpiresAt >= now.AddHours(-24), ct);
            if (recidivist)
                duration = null;
        }

        var rule = new WdFirewallRule
        {
            Name = $"Auto-ban {ip} ({eventType})",
            SourceCidr = ip,
            Action = WdRuleAction.Deny,
            Enabled = true,
            Auto = true,
            ExpiresAt = duration is not null ? now.Add(duration.Value) : null
        };
        
        db.WdFirewallRules.Add(rule);
        await db.SaveChangesAsync(ct);

        // Await enforcement fully before touching DB again — if iptables can't apply, roll back
        // so we don't leave an Enabled rule that was never actually blocking (retried next tick).
        var applied = await firewall.ApplyRuleAsync(rule, ct: ct);
        if (!applied)
        {
            db.WdFirewallRules.Remove(rule);
            await db.SaveChangesAsync(ct);
            logger.LogWarning("[Warden] auto-ban {Ip} ({EventType}) NOT enforced — rolled back, will retry next tick", ip, eventType);
            return;
        }

        logger.LogWarning("[Warden] auto-banned {Ip} ({EventType}) until {Expiry}", ip, eventType, duration?.ToString() ?? "forever");
    }
}