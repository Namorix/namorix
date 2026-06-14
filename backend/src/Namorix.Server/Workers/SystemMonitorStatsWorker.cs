using System.Diagnostics;
using System.Runtime.InteropServices;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Workers;

public class SystemMonitorStatsWorker(IServiceScopeFactory scopeFactory, ILogger<SystemMonitorStatsWorker> logger)
    : BackgroundService
{
    public static object? LatestStats { get; private set; }

    private readonly Process _process = Process.GetCurrentProcess();
    private TimeSpan _prevCpuProcessTime = Process.GetCurrentProcess().TotalProcessorTime;
    private DateTime _prevCpuProcessSample = DateTime.UtcNow;
    private long _prevSysTotal, _prevSysIdle;
    private long? _prevDiskRead, _prevDiskWrite, _prevNetRx, _prevNetTx;

    private const int HistoryCapacitor = 30;

    private static readonly List<double> CpuHistory = new(HistoryCapacitor);
    private static readonly List<double> CpuProcessHistory = new(HistoryCapacitor);
    private static readonly List<double> MemHistory = new(HistoryCapacitor);
    private static readonly List<double> ProcessMemHistory = new(HistoryCapacitor);
    
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(1000, ct);
            try
            {
                _process.Refresh();
                var now = DateTime.UtcNow;
                var cpuProcessTime = _process.TotalProcessorTime;
                var cpuProcessDelta = (cpuProcessTime - _prevCpuProcessTime).TotalMilliseconds;
                var timeProcessDelta = (now - _prevCpuProcessSample).TotalMilliseconds;
                var cpuProcessPct = Math.Round(cpuProcessDelta / timeProcessDelta / Environment.ProcessorCount * 100, 1);
                _prevCpuProcessTime = cpuProcessTime;
                _prevCpuProcessSample = now;

                var memInfoGc = GC.GetGCMemoryInfo();
                var drives = DriveInfo.GetDrives()
                    .Where(d => d.IsReady
                                && d.DriveType == DriveType.Fixed
                                && !d.Name.StartsWith("/proc")
                                && !d.Name.StartsWith("/sys")
                                && !d.Name.StartsWith("/dev")
                                && !d.Name.StartsWith("/run")
                                && !d.Name.StartsWith("/usr/lib")
                                && !d.Name.StartsWith("/mnt/wslg"))
                    .DistinctBy(d => d.TotalSize)
                    .Select(d => new
                    {
                        name = d.Name,
                        total = d.TotalSize,
                        free = d.AvailableFreeSpace,
                    }).ToList();

                long sysTotal = 0, sysIdle = 0;
                long memTotal = 0, memAvailable = 0;
                long diskRead = 0, diskWrite = 0;
                long networkRx = 0, networkTx = 0;

                if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
                {
                    try
                    {
                        var cpuLine = (await File.ReadAllTextAsync("/proc/stat", ct)).Split('\n')[0];
                        var parts = cpuLine.Split(' ', StringSplitOptions.RemoveEmptyEntries).Skip(1).Select(long.Parse)
                            .ToArray();
                        sysTotal = parts.Sum();
                        sysIdle = parts[3];
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to read /proc/stat");
                    }
                    
                    try
                    {
                        var memInfo = await File.ReadAllTextAsync("/proc/meminfo", ct);
                        memTotal = ParseMemInfo(memInfo, "MemTotal:");
                        memAvailable = ParseMemInfo(memInfo, "MemAvailable:");
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to read /proc/meminfo");
                    }
                    
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
                
                var sysDelta = sysTotal - _prevSysTotal;
                var sysCpuPct = sysDelta > 0 ? Math.Round((1 - (double)(sysIdle - _prevSysIdle) / sysDelta) * 100, 1) : 0;
                _prevSysTotal = sysTotal;
                _prevSysIdle = sysIdle;
                
                var memoryTotal = memTotal * 1024;
                var memoryAvailable = memAvailable * 1024;
                var memoryUsedPct = memTotal > 0 ? Math.Round((1 - memAvailable / (double)memTotal) * 100, 1) : 0;

                var diskReadDelta = _prevDiskRead.HasValue ? diskRead - _prevDiskRead.Value : 0;
                var diskWriteDelta = _prevDiskWrite.HasValue ? diskWrite - _prevDiskWrite.Value : 0;
                var rxDelta = _prevNetRx.HasValue ? networkRx - _prevNetRx.Value : 0;
                var txDelta = _prevNetTx.HasValue ? networkTx - _prevNetTx.Value : 0;

                _prevDiskRead = diskRead;
                _prevDiskWrite = diskWrite;
                _prevNetRx = networkRx;
                _prevNetTx = networkTx;
                
                CpuHistory.Add(sysCpuPct);
                CpuProcessHistory.Add(cpuProcessPct);
                MemHistory.Add(memoryUsedPct);
                ProcessMemHistory.Add(_process.WorkingSet64 / (1024.0 * 1024));
                
                if (CpuHistory.Count > HistoryCapacitor)
                    CpuHistory.RemoveAt(0);
                
                if (CpuProcessHistory.Count > HistoryCapacitor)
                    CpuProcessHistory.RemoveAt(0);
                
                if (MemHistory.Count > HistoryCapacitor)
                    MemHistory.RemoveAt(0);
                
                if (ProcessMemHistory.Count > HistoryCapacitor)
                    ProcessMemHistory.RemoveAt(0);

                var stats = new
                {
                    cpu = sysCpuPct,
                    cpuHistory = CpuHistory.ToArray(),
                    cpuProcess = cpuProcessPct,
                    cpuProcessHistory = CpuProcessHistory.ToArray(),
                    memory = new
                    {
                        total = memoryTotal,
                        available = memoryAvailable,
                        usedPct = memoryUsedPct,
                    },
                    memoryHistory = MemHistory.ToArray(),
                    process = new
                    {
                        rss = _process.WorkingSet64,
                        heap = memInfoGc.HeapSizeBytes,
                        total = memInfoGc.TotalAvailableMemoryBytes
                    },
                    processMemoryHistory = ProcessMemHistory.ToArray(),
                    threads = _process.Threads.Count,
                    uptime = (now - _process.StartTime.ToUniversalTime()).TotalSeconds,
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
    private static long ParseMemInfo(string content, string key)
    {
        var line = content.Split('\n').FirstOrDefault(l => l.StartsWith(key));
        if (line == null) return 0;
        var parts = line.Split(':', 2);
        if (parts.Length < 2) return 0;
        var value = parts[1].Trim().Split(' ')[0];
        
        return long.TryParse(value, out var v) ? v : 0;
    }
    
}