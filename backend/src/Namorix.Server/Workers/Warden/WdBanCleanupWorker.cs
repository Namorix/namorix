using Microsoft.EntityFrameworkCore;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Warden;

namespace Namorix.Server.Workers.Warden;

public class WdBanCleanupWorker(IServiceProvider services, ILogger<WdBanCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ReapplyActiveRulesAsync(stoppingToken);       // persistence sau restart
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        try { while (await timer.WaitForNextTickAsync(stoppingToken)) await ExpireBansAsync(stoppingToken); }
        catch (OperationCanceledException) { logger.LogInformation("Warden cleanup worker stopping"); }
    }
    
    private async Task ReapplyActiveRulesAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var firewall = scope.ServiceProvider.GetRequiredService<WdFirewallService>();
        var settings = await db.WdSettings.FirstOrDefaultAsync(ct);
        if (settings is not { FirewallEnabled: true })
            return;
        
        var now = DateTime.UtcNow;
        var active = await db.WdFirewallRules
            .Where(r => r.Enabled && (r.ExpiresAt == null || r.ExpiresAt > now)).ToListAsync(ct);
        await firewall.ApplyAllAsync(active, ct: ct);
    }
    
    private async Task ExpireBansAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var firewall = scope.ServiceProvider.GetRequiredService<WdFirewallService>();
        var now = DateTime.UtcNow;
        var expired = await db.WdFirewallRules
            .Where(r => r.Enabled && r.ExpiresAt != null && r.ExpiresAt < now).ToListAsync(ct);

        foreach (var rule in expired)
        {
            rule.Enabled = false;
            await firewall.RemoveRuleAsync(rule, ct: ct);
        }

        if (expired.Count > 0)
        {
            await db.SaveChangesAsync(ct); logger.LogInformation("[Warden] expired {Count} bans", expired.Count);
        }
    }
}