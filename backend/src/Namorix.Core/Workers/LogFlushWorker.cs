using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Core.FlatFile;
using Namorix.Core.Infrastructure;

namespace Namorix.Core.Workers;

public class LogFlushWorker(
    IFlatFileStore flatFileStore,
    ILogNotifier notifier,
    ILogger<LogFlushWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var batch = new List<LogEntrySerializer>(100);
        while (!stoppingToken.IsCancellationRequested)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            try { await LogBuffer.Entries.Reader.WaitToReadAsync(cts.Token); }
            catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested) { }

            while (batch.Count < 100 && LogBuffer.Entries.Reader.TryRead(out var e))
                batch.Add(e);

            if (batch.Count == 0) continue;

            try
            {
                foreach (var e in batch)
                    await flatFileStore.AppendAsync(e, e.LogGroup);

                await notifier.NotifyFlushAsync(batch);
                batch.Clear();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to flush {Count} log entries", batch.Count);
            }
        }
    }
}