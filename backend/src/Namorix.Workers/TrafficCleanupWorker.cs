using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Adapters.Persistence;

namespace Namorix.Workers;

public class TrafficCleanupWorker(IServiceScopeFactory scopeFactory,
    ILogger<TrafficCleanupWorker> logger): BackgroundService
{
    // TODO update delete traffic address
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Traffic cleanup worker starting");
        await Cleanup(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await Cleanup(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Traffic cleanup worker stopping");
        }
    }

    private async Task Cleanup(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-30);
            var count = await db.TrafficLogs
                .Where(l => l.Timestamp < cutoff)
                .ExecuteDeleteAsync(stoppingToken);
            
            if (count > 0)
                logger.LogInformation("Cleanup {Count} traffic logs older than 30 days", count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean traffic logs");
        }
    }
}