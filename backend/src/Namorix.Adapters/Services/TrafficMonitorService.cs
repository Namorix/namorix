using System.Diagnostics;
using Namorix.Adapters.Filters;
using Namorix.Adapters.FlatFile;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;

namespace Namorix.Adapters.Services;

public class TrafficMonitorService(IFlatFileStore flatFileStore, DataDirectory dataDir)
{
    public async Task<(List<TrafficLogSerializer> Items, long Total, long ElapsedMs)> GetLogs(
        int page, int pageSize, DateTime? from, DateTime? to, string? search = null)
    {
        var sw = Stopwatch.StartNew();
        
        var filter = TrafficLogFilterParser.Parse(page, pageSize, null, from, to, search);
        var predicate = filter.ToPredicate();
        var skip = (page - 1) * pageSize;
        
        var total = await flatFileStore.CountAsync(predicate);
        var items = new List<TrafficLogSerializer>();
        await foreach (var item in flatFileStore.QueryAsync(predicate, skip, pageSize))
            items.Add(item);
        
        sw.Stop();
        return (items, total, sw.ElapsedMilliseconds);
    }
    
    public async Task<TrafficStats> GetStats(DateTime? from, DateTime? to)
    {
        var logs = new List<TrafficLogSerializer>();
        await foreach (var item in flatFileStore.QueryAsync<TrafficLogSerializer>(log =>
        {
           if (from.HasValue && log.Timestamp < from.Value) return false;
           return !to.HasValue || log.Timestamp <= to.Value;
        }))
        logs.Add(item);
        
        return new TrafficStats
        {
            TotalRequests = logs.Count,
            ErrorCount = logs.Count(l => l.StatusCode >= 400),
            AvgDurationMs = logs.Count > 0 ? logs.Average(l => l.DurationMs) : 0,
            AvgResponseSizeBytes = logs.Count > 0 ? logs.Average(l => l.ResponseSizeBytes) : 0,
            StatusCodes = logs.GroupBy(l => l.StatusCode)
                .ToDictionary(g => g.Key.ToString(), g => (long)g.Count()),
            ByEndpoint = []
        };
    }
    public Task ClearLogs(DateTime? before)
    {
        return dataDir.PurgeAllAsync(before ?? DateTime.UtcNow);
    }
}

public class TrafficStats
{
    public long TotalRequests { get; init; }
    public long ErrorCount { get; init; }
    public double AvgDurationMs { get; init; }
    public double AvgResponseSizeBytes { get; init; }
    public Dictionary<string, long> StatusCodes { get; init; } = [];
    public List<EndpointStats> ByEndpoint { get; init; } = [];
}

public abstract class EndpointStats
{
    public string Path { get; init; } = "";
    public string Method { get; init; } = "";
    public long Count { get; init; }
    public double AvgDurationMs { get; init; }
    public double ErrorRate { get; init; }
}