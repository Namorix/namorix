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

            var refreshCount = await db.RefreshTokens
                .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
                .ExecuteDeleteAsync(cancellationToken);

            var regCount = await db.OAuthRegistrations
                .Where(r => r.Used || r.ExpiresAt < DateTime.UtcNow)
                .ExecuteDeleteAsync(cancellationToken);
            
            var oauthRefreshCount = await db.OAuthRefreshTokens
                .Where(r => r.Used || r.ExpiresAt < DateTime.UtcNow)
                .ExecuteDeleteAsync(cancellationToken);
            
            if (refreshCount > 0 || regCount > 0 || oauthRefreshCount > 0)
            {
                logger.LogInformation("Cleaned {RefreshCount} expired refresh tokens, {RegCount} expired registrations",
                    refreshCount, regCount);
            }
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