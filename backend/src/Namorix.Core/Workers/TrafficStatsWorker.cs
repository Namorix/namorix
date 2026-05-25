using Microsoft.Extensions.Hosting;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;
using Namorix.Core.Services;

namespace Namorix.Core.Workers;

public class TrafficStatsWorker(IFlatFileStore flatFileStore,
    TrafficMonitorService monitorService,
    DataDirectory dataDir) : BackgroundService
{
    private readonly object _scanLock = new();
    private bool _scanning;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(1000, stoppingToken);
        await ScanAllAsync(stoppingToken);

        var trafficDir = dataDir.TrafficPath;
        if (!Directory.Exists(trafficDir))
            Directory.CreateDirectory(trafficDir);

        using var watcher = new FileSystemWatcher(trafficDir, "*.log");
        watcher.Deleted += async (_, _) =>
        {
            if (_scanning) return;
            await Task.Delay(500, stoppingToken);
            await ScanAllAsync(CancellationToken.None);
        };
        watcher.EnableRaisingEvents = true;

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException) { }
    }

    private async Task ScanAllAsync(CancellationToken ct)
    {
        lock (_scanLock)
        {
            if (_scanning) return;
            _scanning = true;
        }

        try
        {
            var logs = new List<TrafficLogSerializer>();
            await foreach (var log in flatFileStore
                               .QueryAsync<TrafficLogSerializer>(null, null, null)
                               .WithCancellation(ct))
            {
                logs.Add(log);
            }
            monitorService.Initialize(logs);
        }
        finally
        {
            lock (_scanLock) _scanning = false;
        }
    }
}