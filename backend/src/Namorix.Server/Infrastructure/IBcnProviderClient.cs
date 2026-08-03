using System.Net;
using Namorix.Server.Models;

namespace Namorix.Server.Infrastructure;

public interface IBcnProviderClient
{
    BcnProviderInfo Info { get; }
    Task<BcnUpdateResult> UpdateAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
    
    Task<BcnTestResult> TestAsync(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
}

public record BcnUpdateResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null,
    bool RateLimited = false, DateTimeOffset? RetryAfter = null);
public record BcnTestResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null);