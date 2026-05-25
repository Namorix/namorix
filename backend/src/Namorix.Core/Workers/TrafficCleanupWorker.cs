using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Adapters.FlatFile;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;

namespace Namorix.Workers;

public class TrafficCleanupWorker(DataDirectory dataDir,
    ILogger<TrafficCleanupWorker> logger): BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Traffic cleanup worker starting");
        Cleanup();

        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                Cleanup();
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Traffic cleanup worker stopping");
        }
    }

    private void Cleanup()
    {
        try
        {
            var deleted = dataDir.PurgeCategory<TrafficLogSerializer>(30);
            if (deleted > 0)
                logger.LogInformation("Cleanup {MonthCount} traffic log directories", deleted);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean traffic logs");
        }
    }
}