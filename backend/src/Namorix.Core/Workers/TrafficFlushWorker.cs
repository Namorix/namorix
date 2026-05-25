using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Core.FlatFile;
using Namorix.Core.Infrastructure;
using Namorix.Core.Services;

namespace Namorix.Core.Workers;

public class TrafficFlushWorker(IFlatFileStore flatFileStore,
    TrafficMonitorService monitorService,
    IServiceScopeFactory scopeFactory,
    ILogger<TrafficFlushWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var batch = new List<TrafficLogSerializer>(100);
        while (!stoppingToken.IsCancellationRequested)
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            try
            {
                await TrafficBuffer.Logs.Reader.WaitToReadAsync(cts.Token);
            } catch (OperationCanceledException) when(!stoppingToken.IsCancellationRequested) {}
            
            while (batch.Count < 100 && TrafficBuffer.Logs.Reader.TryRead(out var log))
                batch.Add(log);
            
            if (batch.Count == 0)
                continue;
            
            try
            {
                foreach (var log in batch)
                    await flatFileStore.AppendAsync(log);
                
                monitorService.Accumulate(batch); 
                using var scope = scopeFactory.CreateScope();
                var notifier = scope.ServiceProvider.GetRequiredService<ITrafficNotifier>();
                await notifier.NotifyFlushAsync();
                batch.Clear();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                logger.LogInformation("TrafficFlushWorker stopping, {Count} logs dropped", batch.Count);
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to flush {Count} traffic logs. Retrying next cycle", batch.Count);
            }
        }
    }
}