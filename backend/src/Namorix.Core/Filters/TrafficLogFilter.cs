using Namorix.Adapters.FlatFile;
using Namorix.Core.FlatFile;

namespace Namorix.Adapters.Filters;

public record TrafficLogFilter
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
    public int? EndpointId { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
    public string? Method { get; init; }
    public string? Path { get; init; }
    public string? Ip { get; init; }
    public int? StatusCode { get; init; }
    public int? StatusCodeMin { get; init; }
    public int? StatusCodeMax { get; init; }
}

public static class TrafficLogFilterPredicate
{
    public static Func<TrafficLogSerializer, bool> ToPredicate(this TrafficLogFilter filter)
    {
        return log =>
        {
            if (filter.From.HasValue && log.Timestamp < filter.From.Value) 
                return false;
            
            if (filter.To.HasValue && log.Timestamp > filter.To.Value)
                return false;
            
            if (!string.IsNullOrWhiteSpace(filter.Method) && 
                (log.Method == null || !log.Method.Contains(filter.Method, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }
            
            if (!string.IsNullOrWhiteSpace(filter.Path) && 
                (log.Path == null || !log.Path.Contains(filter.Path, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }
            
            if (!string.IsNullOrWhiteSpace(filter.Ip) && 
                (log.Ip == null || !log.Ip.StartsWith(filter.Ip, StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }
            
            if (filter.StatusCode.HasValue && log.StatusCode != filter.StatusCode.Value)
                return false;
            
            if (filter.StatusCodeMin.HasValue && log.StatusCode < filter.StatusCodeMin.Value)
                return false;
            
            return !filter.StatusCodeMax.HasValue || log.StatusCode <= filter.StatusCodeMax.Value;
        };
    }
}