using Microsoft.EntityFrameworkCore;
using Namorix.Server.Persistence;

namespace Namorix.Server.Workers;

public class TokenCleanupWorker(IServiceProvider serviceProvider,
    ILogger<TokenCleanupWorker> logger): BackgroundService
{
    private async Task CleanupExpiredTokens(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await db.RefreshTokens
                .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
                .ExecuteDeleteAsync(cancellationToken);

            if (count > 0)
                logger.LogInformation("Cleaned {Count} expired refresh tokens", count);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean expired tokens, will retry next cycle");
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Token cleanup worker starting");
        await CleanupExpiredTokens(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupExpiredTokens(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Token cleanup worker stopping");
        }
    }
}