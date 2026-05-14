using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class TokenCleanupService(IServiceProvider serviceProvider,
    ILogger<TokenCleanupService> logger): BackgroundService
{
    private async Task CleanupExpiredTokens(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var count = await db.RefreshTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync(cancellationToken);
        
        if (count > 0)
            logger.LogInformation("Cleaned {Count} expired refresh tokens", count);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Token cleanup service starting");
        await CleanupExpiredTokens(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupExpiredTokens(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Token cleanup service stopping");
        }
    }
}