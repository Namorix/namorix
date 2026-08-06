using System.Net;
using Namorix.Server.Models;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Infrastructure;

public interface IBcnProviderClient
{
    BcnProviderInfo Info { get; }
    // host = chuỗi tag đầy đủ (comma-separated: "@,www,*.example.com") — provider tự split xử lý multi-host.
    // domain = FQDN/zone; mỗi provider dùng cái nó cần. Params trả về phải gắn hostname tag fail để i18n.
    Task<BcnUpdateResult> UpdateAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
    Task<BcnTestResult> TestAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct);
}

public record BcnUpdateResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null,
    bool RateLimited = false, DateTimeOffset? RetryAfter = null);
public record BcnTestResult(bool Success, string? Code = null,
    Dictionary<string, object?>? Params = null);
    
public record BcnCurrentRecord(string? Ipv4 = null, string? Ipv6 = null)
{
    public bool HasAny => Ipv4 is not null || Ipv6 is not null;
    public bool Matches(string? ipv4, string? ipv6) => Ipv4 == ipv4 && Ipv6 == ipv6;
}