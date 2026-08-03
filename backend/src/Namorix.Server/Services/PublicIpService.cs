using System.Net;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services;

public static class PublicIpServices
{
    public const string Auto = "auto";
    public const string Ipify = "ipify.org";
    public static readonly IReadOnlyList<string> All = [Ipify];
    public static IReadOnlyList<string> Resolve(string service)
    {
        if (service == Auto) return All;
        return All.Contains(service) ? [service] : [];
    }
}

public sealed class PublicIpService(IHttpClientFactory httpFactory) : IPublicIpDetector
{
    public async Task<IPAddress?> DetectIPv4Async(string service, CancellationToken ct) =>
        await DetectFirstAsync(service, ipv6: false, ct);

    public async Task<IPAddress?> DetectIPv6Async(string service, CancellationToken ct) =>
        await DetectFirstAsync(service, ipv6: true, ct);

    public async Task<PublicIpResult> DetectAsync(string service, bool includeIpv6, CancellationToken ct)
    {
        var ipv4Task = DetectFirstAsync(service, ipv6: false, ct);
        var ipv6Task = includeIpv6 ? DetectFirstAsync(service, ipv6: true, ct)
                                   : Task.FromResult<IPAddress?>(null);
        await Task.WhenAll(ipv4Task, ipv6Task);
        return new PublicIpResult(await ipv4Task, await ipv6Task);
    }

    private async Task<IPAddress?> DetectFirstAsync(string service, bool ipv6, CancellationToken ct)
    {
        foreach (var name in PublicIpServices.Resolve(service))
        {
            var ip = await FetchAsync(Endpoint(name, ipv6), ct);
            if (ip is not null) return ip;
        }
        return null;
    }

    private async Task<IPAddress?> FetchAsync(string url, CancellationToken ct)
    {
        try
        {
            using var client = httpFactory.CreateClient("PublicIp");
            using var resp = await client.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode) return null;
            var body = (await resp.Content.ReadAsStringAsync(ct)).Trim();
            return IPAddress.TryParse(body, out var ip) ? ip : null;
        }
        catch (Exception)
        {
            return null;   // Service failed → try the next service
        }
    }

    private static string Endpoint(string service, bool ipv6) => (service, ipv6) switch
    {
        (PublicIpServices.Ipify, false) => "https://api.ipify.org",
        (PublicIpServices.Ipify, true) => "https://api6.ipify.org",
        _ => string.Empty,   // Invalid service → filtered by Resolve, unreachable code
    };
}
