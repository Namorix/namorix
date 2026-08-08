using System.Net.Security;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers.Frontgate;

public class FgBackendHealthWorker(IServiceScopeFactory scopeFactory, ILogger<FgBackendHealthWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(5);
    private static readonly HttpClient ProbeClient = new(new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
            ConnectTimeout = ProbeTimeout,
            SslOptions = new SslClientAuthenticationOptions()
            {
                RemoteCertificateValidationCallback = (_, _, _, _) => true,
            },
        })
        { Timeout = ProbeTimeout };

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(CheckInterval);
        while (await timer.WaitForNextTickAsync(ct))
        {
            try
            {
                await CheckAsync(ct);
            }
            catch (OperationCanceledException)
            {
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Backend health check failed");
            }
        }
    }
 
    private async Task CheckAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notifier = scope.ServiceProvider.GetRequiredService<IFrontgateNotifier>();

        var rules = await db.FgReverseProxyRules
            .Where(r => r.Status == ProxyRuleStatus.Active)
            .ToListAsync(ct);
        
        if (rules.Count == 0)
            return;

        var now = DateTime.UtcNow;
        foreach (var rule in rules)
        {
            var healthy = await ProbeAsync(rule, ct);
            var changed = healthy != rule.IsHealthy;
            rule.IsHealthy = healthy;
            rule.LastHealthCheckAt = now;
            if (!changed)
                continue;
            
            await notifier.NotifyRuleChanged(rule.Id, FgRuleAction.Updated);
            logger.LogInformation("Rule {Source} backend is now {State}",
                rule.Source, healthy ? "up" : "down");
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task<bool> ProbeAsync(FgReverseProxyRule rule, CancellationToken ct)
    {
        try
        {
            var url = $"{rule.DestinationScheme}://{rule.DestinationHost}:{rule.DestinationPort}/";
            using var resp = await ProbeClient.GetAsync(url, ct);
            return (int)resp.StatusCode < 400; // 2xx/3xx = up; 4xx/5xx/exception = down
        }
        catch
        {
            return false;
        }
    }
}
