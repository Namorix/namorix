using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Core.OAuth;

namespace Namorix.Core.AddonSession;

public sealed class AddonTokenCleanupWorker(
    IAddonTokenStore tokens,
    NmxOAuth2Client oauth,
    ILogger<AddonTokenCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await CleanupAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await CleanupAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Shutdown.
        }
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        try
        {
            var expired = await tokens.DeleteExpiredAsync(ct);
            if (expired > 0)
                logger.LogInformation("Dropped {Count} expired addon grant(s)", expired);

            // ClientId is null until the channel authenticates, which is a background task
            // no hosted service waits for. Skipping is the only safe answer: deleting on an
            // unknown id would take every grant the addon holds.
            if (oauth.ClientId is not { } clientId)
                return;

            var others = await tokens.DeleteOtherClientsAsync(clientId, ct);
            if (others > 0)
                logger.LogInformation(
                    "Dropped {Count} addon grant(s) left by an earlier ClientId", others);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean up addon grants");
        }
    }
}
