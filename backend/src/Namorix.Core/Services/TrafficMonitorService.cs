using System.Diagnostics;
using Namorix.Core.Filters;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;

namespace Namorix.Core.Services;

public class TrafficMonitorService(IFlatFileStore flatFileStore, DataDirectory dataDir)
{
    private HourlyBucket[] _buckets = new HourlyBucket[24];
    private readonly object _lock = new();
    private long _totalRequests;
    private long _errorCount;
    private double _avgDurationMs;
    private double _avgResponseSizeBytes;

    public void Reset()
    {
        lock (_lock)
        {
            _totalRequests = 0;
            _errorCount = 0;
            _avgDurationMs = 0;
            _avgResponseSizeBytes = 0;
        }
    }

    public void Initialize(List<TrafficLogSerializer> logs)
    {
        var buckets = new HourlyBucket[24];
        for (int i = 0; i < 24; i++)
            buckets[i] = new HourlyBucket { Hour = i };
        foreach (var log in logs)
        {
            var h = log.Timestamp.Hour;
            buckets[h] = buckets[h] with
            {
                Requests = buckets[h].Requests + 1,
                Errors = buckets[h].Errors + (log.StatusCode >= 400 ? 1 : 0),
                TotalDuration = buckets[h].TotalDuration + log.DurationMs,
                TotalSize = buckets[h].TotalSize + log.ResponseSizeBytes,
            };
        }
        lock (_lock)
        {
            _buckets = buckets;
            _totalRequests = logs.Count;
            _errorCount = logs.Count(l => l.StatusCode >= 400);
            _avgDurationMs = logs.Count > 0 ? logs.Average(l => l.DurationMs) : 0;
            _avgResponseSizeBytes = logs.Count > 0 ? logs.Average(l => l.ResponseSizeBytes) : 0;
        }
    }

    public void Accumulate(List<TrafficLogSerializer> batch)
    {
        lock (_lock)
        {
            var prevTotal = _totalRequests;
            _totalRequests += batch.Count;
            _errorCount += batch.Count(l => l.StatusCode >= 400);
            _avgDurationMs = prevTotal > 0
                ? (_avgDurationMs * prevTotal + batch.Sum(l => l.DurationMs)) / _totalRequests
                : batch.Average(l => l.DurationMs);
            _avgResponseSizeBytes = prevTotal > 0
                ? (_avgResponseSizeBytes * prevTotal + batch.Sum(l => l.ResponseSizeBytes)) / _totalRequests
                : batch.Average(l => l.ResponseSizeBytes);
            foreach (var log in batch)
            {
                var h = log.Timestamp.Hour;
                ref var b = ref _buckets[h];
                b = b with
                {
                    Requests = b.Requests + 1,
                    Errors = b.Errors + (log.StatusCode >= 400 ? 1 : 0),
                    TotalDuration = b.TotalDuration + log.DurationMs,
                    TotalSize = b.TotalSize + log.ResponseSizeBytes,
                };
            }
        }
    }
    
    public HourlyBucket[] GetTimeSeries()
    {
        lock (_lock) return _buckets.ToArray();
    }
    
    public async Task<(List<TrafficLogSerializer> Items, long Total, long ElapsedMs)> GetLogs(
        int page, int pageSize, DateTime? from, DateTime? to, string? search = null)
    {
        var sw = Stopwatch.StartNew();
        var filter = TrafficLogFilterParser.Parse(page, pageSize, null, from, to, search);
        var predicate = filter.ToPredicate();
        var total = await flatFileStore.CountAsync(predicate);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)total / pageSize));
        if (page > totalPages) page = totalPages;
        var skip = (page - 1) * pageSize;
        var items = new List<TrafficLogSerializer>();
        await foreach (var item in flatFileStore.QueryAsync(predicate, skip, pageSize))
            items.Add(item);
        sw.Stop();

        return (items, total, sw.ElapsedMilliseconds);
    }
    
    public TrafficStats GetStats(DateTime? from = null, DateTime? to = null)
    {
        lock (_lock)
        {
            return new TrafficStats
            {
                TotalRequests = _totalRequests,
                ErrorCount = _errorCount,
                AvgDurationMs = _avgDurationMs,
                AvgResponseSizeBytes = _avgResponseSizeBytes,
            };
        }
    }
    
    public Task ClearLogs(DateTime? before)
    {
        return dataDir.PurgeAllAsync(before ?? DateTime.UtcNow);
    }
}

public record HourlyBucket
{
    public int Hour { get; init; }
    public long Requests { get; init; }
    public long Errors { get; init; }
    public double TotalDuration { get; init; }
    public double TotalSize { get; init; }
    public double AvgDuration => Requests > 0 ? TotalDuration / Requests : 0;
    public double AvgSize => Requests > 0 ? TotalSize / Requests : 0;
}

public class TrafficStats
{
    public long TotalRequests { get; init; }
    public long ErrorCount { get; init; }
    public double AvgDurationMs { get; init; }
    public double AvgResponseSizeBytes { get; init; }
}