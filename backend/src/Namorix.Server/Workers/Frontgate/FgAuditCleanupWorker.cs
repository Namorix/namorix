using Microsoft.EntityFrameworkCore;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers.Frontgate;

public class FgAuditCleanupWorker(IServiceProvider serviceProvider,
    ILogger<FgAuditCleanupWorker> logger) : BackgroundService
{
    private const int RetentionDays = 30;

    private async Task CleanupOldAuditLogs(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await db.FgAuditLogs
                .Where(l => l.Timestamp < DateTime.UtcNow.AddDays(-RetentionDays))
                .ExecuteDeleteAsync(cancellationToken);

            if (count > 0)
                logger.LogInformation("Cleaned {Count} old Frontgate audit logs", count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean old Frontgate audit logs");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Frontgate audit cleanup worker starting");
        await CleanupOldAuditLogs(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupOldAuditLogs(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Frontgate audit cleanup worker stopping");
        }
    }
}