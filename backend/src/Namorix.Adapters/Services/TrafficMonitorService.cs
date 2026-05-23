using Microsoft.EntityFrameworkCore;
using Namorix.Adapters.Persistence;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class TrafficMonitorService(AppDbContext appDbContext)
{
    public async Task<TrafficEndpoint> RegisterEndpoint(string method, string path, string? label)
    {
        var endpoint = new TrafficEndpoint
        {
            Method = method,
            Path = path,
            Label = label
        };

        appDbContext.TrafficEndpoints.Add(endpoint);
        await appDbContext.SaveChangesAsync();
        return endpoint;
    }

    public async Task RemoveEndpoint(int id)
    {
        await appDbContext.TrafficEndpoints.Where(e => e.Id == id).ExecuteDeleteAsync();
    }

    public async Task<List<TrafficEndpoint>> ListEndpoints()
    {
        return await appDbContext.TrafficEndpoints.OrderBy(e => e.Path).ToListAsync();
    }

    public async Task<(List<TrafficLog> Items, long Total)> GetLogs(
        int page, int pageSize, int? endpointId, DateTime? from, DateTime? to, string? search = null)
    {
        var query = appDbContext.TrafficLogs
            .Include(l => l.Endpoint)
            .Include(l => l.TrafficAddress)
            .AsQueryable();
        
        if (endpointId.HasValue)
            query = query.Where(l => l.EndpointId == endpointId.Value);
        
        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from.Value);
        
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to.Value);
        
        if (!string.IsNullOrWhiteSpace(search))
        {
            int.TryParse(search, out var statusCode);
    
            query = query.Where(l =>
                (l.Endpoint != null && (
                    l.Endpoint.Path.Contains(search) ||
                    l.Endpoint.Method.Contains(search)
                )) ||
                (l.TrafficAddress != null && 
                 l.TrafficAddress.Ip.StartsWith(search)
                ) ||
                (statusCode != 0 && l.StatusCode == statusCode)
            );
        }
        
        var total = await query.LongCountAsync();
        var items = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return (items, total);
    }

    public async Task<TrafficStats> GetStats(DateTime? from, DateTime? to)
    {
        var query = appDbContext.TrafficLogs.AsQueryable();

        if (from.HasValue)
            query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(l => l.Timestamp <= to.Value);

        var logs = await query.ToListAsync();

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

    public async Task ClearLogs(DateTime? before)
    {
        var query = appDbContext.TrafficLogs.AsQueryable();
        if (before.HasValue)
            query = query.Where(l => l.Timestamp < before.Value);
        await query.ExecuteDeleteAsync();
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

public class EndpointStats
{
    public int EndpointId { get; init; }
    public string Path { get; init; } = "";
    public string Method { get; init; } = "";
    public long Count { get; init; }
    public double AvgDurationMs { get; init; }
    public double ErrorRate { get; init; }
}