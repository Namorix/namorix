using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Workers.Frontgate;

public class FgDryRunRollbackWorker(IServiceScopeFactory scopeFactory,
    FrontgateProxyConfigProvider proxyProvider, ILogger<FgDryRunRollbackWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        while (await timer.WaitForNextTickAsync(ct))
        {
            try
            {
                if (!proxyProvider.HasDryRun)
                    continue;

                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notifier = scope.ServiceProvider.GetRequiredService<IFrontgateNotifier>();
                var expired = await db.FgReverseProxyRules
                    .Include(r => r.Locations)
                    .Where(r => r.DryRunExpiresAt != null && r.DryRunExpiresAt < DateTime.UtcNow)
                    .ToListAsync(ct);

                if (expired.Count == 0)
                    continue;

                foreach (var rule in expired)
                {
                    if (!string.IsNullOrEmpty(rule.DryRunSnapshotJson))
                    {
                        JsonSerializer.Deserialize<FgRuleSnapshot>(rule.DryRunSnapshotJson)?.ApplyTo(rule);
                        rule.DryRunExpiresAt = null;
                        rule.DryRunSnapshotJson = null;
                    }
                    else db.FgReverseProxyRules.Remove(rule);
                }

                await db.SaveChangesAsync(ct);
                await proxyProvider.UpdateAsync();
                
                foreach (var rule in expired)
                    await notifier.NotifyDryRunChanged(rule.Id, FgDryRunAction.Expire);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Fg dry-run rollback failed");
            }
        }
    }
}