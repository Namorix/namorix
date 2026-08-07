using Microsoft.EntityFrameworkCore;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers.Frontgate;

public class FgCertPendingResetWorker(
    IServiceProvider serviceProvider,
    ILogger<FgCertPendingResetWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await db.FgCertificates
                .Where(c => c.Status == FgCertificateStatus.Pending)
                .ExecuteUpdateAsync(
                    s => s.SetProperty(c => c.Status, FgCertificateStatus.Error),
                    stoppingToken);

            if (count > 0)
                logger.LogWarning("Reset {Count} pending certificates to error", count);
        }
        catch (OperationCanceledException) {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to reset pending certificates");
        }
    }
}