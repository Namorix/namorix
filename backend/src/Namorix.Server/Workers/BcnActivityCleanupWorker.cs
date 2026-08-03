using Microsoft.EntityFrameworkCore;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers;

public class BcnActivityCleanupWorker(IServiceProvider serviceProvider,
    ILogger<BcnActivityCleanupWorker> logger) : BackgroundService
{
    private const int RetentionDays = 7;

    private async Task CleanupOldActivityLogs(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await db.BcnActivityLogs
                .Where(l => l.Timestamp < DateTime.UtcNow.AddDays(-RetentionDays))
                .ExecuteDeleteAsync(cancellationToken);

            if (count > 0)
                logger.LogInformation("Cleaned {Count} old Beacon activity logs", count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean old Beacon activity logs");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Beacon activity cleanup worker starting");
        await CleanupOldActivityLogs(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupOldActivityLogs(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Beacon activity cleanup worker stopping");
        }
    }
}