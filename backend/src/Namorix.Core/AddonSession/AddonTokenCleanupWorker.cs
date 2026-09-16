using Microsoft.Extensions.Hosting;

namespace Namorix.Core.AddonSession;

public sealed class AddonTokenCleanupWorker(AddonTokenCleanup cleanup) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await cleanup.RunAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(30));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await cleanup.RunAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Shutdown.
        }
    }
}
