using System.Net;

namespace Namorix.Server.Infrastructure;

public interface IPublicIpDetector
{
    Task<IPAddress?> DetectIPv4Async(string service, CancellationToken ct);
    Task<IPAddress?> DetectIPv6Async(string service, CancellationToken ct);
    Task<PublicIpResult> DetectAsync(string service, bool includeIpv6, CancellationToken ct);
}

public record PublicIpResult(IPAddress? IPv4, IPAddress? IPv6)
{
    public bool HasAny => IPv4 is not null || IPv6 is not null;
}