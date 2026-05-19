namespace Namorix.Core.Models;

public class TrafficLog
{
    public long Id { get; init; }
    
    public int EndpointId { get; init; }
    public TrafficEndpoint? Endpoint { get; init; }
    
    public int StatusCode { get; init; }
    public long DurationMs { get; init; }
    public long ResponseSizeBytes { get; init; }
    
    public long? TrafficAddressId { get; init; }
    public TrafficAddress? TrafficAddress { get; init; }
    
    public int? UserId { get; init; }

    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}