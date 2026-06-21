using Microsoft.EntityFrameworkCore;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers;

public class NotificationCleanupWorker(IServiceProvider serviceProvider,
    ILogger<NotificationCleanupWorker> logger) : BackgroundService
{
    private async Task CleanupOldNotifications(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await db.Notifications
                .Where(n => n.IsRead && n.LastOccurredAt < DateTime.UtcNow.AddDays(-7))
                .ExecuteDeleteAsync(cancellationToken);

            if (count > 0)
                logger.LogInformation("Cleaned {Count} old read notifications", count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean old notifications");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Notification cleanup worker starting");
        await CleanupOldNotifications(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupOldNotifications(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Notification cleanup worker stopping");
        }
    }
}