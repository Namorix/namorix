using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;

namespace Namorix.Core.Workers;

public class LogCleanupWorker(DataDirectory dataDir,
    ILogger<LogCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Log cleanup worker starting");
        Cleanup();

        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
                Cleanup();
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Log cleanup worker stopping");
        }
    }

    private void Cleanup()
    {
        try
        {
            var deleted = dataDir.PurgeCategory<LogEntrySerializer>(7);
            if (deleted > 0)
                logger.LogInformation("Cleanup {DayCount} log directories", deleted);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean log files");
        }
    }
}