using System.Diagnostics;
using System.Runtime.InteropServices;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Workers;

public class SystemStatsWorker(IServiceScopeFactory scopeFactory, ILogger<SystemStatsWorker> logger)
    : BackgroundService
{
    public static object? LatestStats { get; private set; }

    private readonly Process _process = Process.GetCurrentProcess();
    private TimeSpan _prevCpuTime = Process.GetCurrentProcess().TotalProcessorTime;
    private DateTime _prevCpuSample = DateTime.UtcNow;
    private long? _prevDiskRead, _prevDiskWrite, _prevNetRx, _prevNetTx;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(1000, ct);
            try
            {
                _process.Refresh();
                var now = DateTime.UtcNow;
                var cpuTime = _process.TotalProcessorTime;
                var cpuDelta = (cpuTime - _prevCpuTime).TotalMilliseconds;
                var timeDelta = (now - _prevCpuSample).TotalMilliseconds;
                var cpuPct = Math.Round(cpuDelta / timeDelta / Environment.ProcessorCount * 100, 1);
                _prevCpuTime = cpuTime;
                _prevCpuSample = now;

                var memInfo = GC.GetGCMemoryInfo();
                var drives = DriveInfo.GetDrives().Where(d => d.IsReady).Select(d => new
                {
                    name = d.Name,
                    total = d.TotalSize,
                    free = d.AvailableFreeSpace,
                }).ToList();

                long diskRead = 0, diskWrite = 0;
                long networkRx = 0, networkTx = 0;

                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    try
                    {
                        var ioLines = await File.ReadAllLinesAsync("/proc/self/io", ct);
                        diskRead = long.Parse(ioLines.First(l => l.StartsWith("read_bytes:")).Split(':')[1].Trim());
                        diskWrite = long.Parse(ioLines.First(l => l.StartsWith("write_bytes:")).Split(':')[1].Trim());
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to read /proc/self/io");
                    }
                    
                    try
                    {
                        var netLines = await File.ReadAllLinesAsync("/proc/net/dev", ct);
                        foreach (var line in netLines.Skip(2))
                        {
                            var parts = line.Trim().Split(':', 2);
                            if (parts.Length < 2) continue;
                            if (parts[0].Trim() == "lo") continue;
                            var fields = parts[1].Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                            networkRx += long.Parse(fields[0]);
                            networkTx += long.Parse(fields[8]);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to read /proc/net/dev");
                    }
                }
                
                var diskReadDelta = _prevDiskRead.HasValue ? diskRead - _prevDiskRead.Value : 0;
                var diskWriteDelta = _prevDiskWrite.HasValue ? diskWrite - _prevDiskWrite.Value : 0;
                var rxDelta = _prevNetRx.HasValue ? networkRx - _prevNetRx.Value : 0;
                var txDelta = _prevNetTx.HasValue ? networkTx - _prevNetTx.Value : 0;

                _prevDiskRead = diskRead;
                _prevDiskWrite = diskWrite;
                _prevNetRx = networkRx;
                _prevNetTx = networkTx;

                var stats = new
                {
                    cpu = cpuPct,
                    memory = new
                    {
                        rss = _process.WorkingSet64,
                        heap = memInfo.HeapSizeBytes,
                        total = memInfo.TotalAvailableMemoryBytes,
                    },
                    threads = _process.Threads.Count,
                    uptime = (now - _process.StartTime.ToUniversalTime()).ToString(@"dd\.hh\:mm\:ss"),
                    environment = new
                    {
                        os = RuntimeInformation.OSDescription,
                        framework = RuntimeInformation.FrameworkDescription,
                        machine = Environment.MachineName,
                        cores = Environment.ProcessorCount,
                    },
                    disk = drives,
                    diskIo = new
                    {
                        readBytesPerSec = diskReadDelta,
                        writeBytesPerSec = diskWriteDelta
                    },
                    networkIo = new
                    {
                        rxBytesPerSec = rxDelta,
                        txBytesPerSec = txDelta
                    },
                };

                LatestStats = stats;
                using var scope = scopeFactory.CreateScope();
                var notifier = scope.ServiceProvider.GetRequiredService<ISystemMonitorNotifier>();
                await notifier.NotifyStatsAsync(stats);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "System stats push failed");
            }
        }
    }
}