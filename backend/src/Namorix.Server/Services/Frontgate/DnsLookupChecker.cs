using System.Net;
using DnsClient;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services.Frontgate;

public record DryRunWarning(string Domain, string[] ResolvedIps, string? ServerIp);

public class DnsLookupChecker(IPublicIpDetector ipDetector)
{
    private static readonly LookupClient Dns = new();

    public async Task<List<DryRunWarning>> CheckAsync(IReadOnlyList<string> domains, CancellationToken ct)
    {
        var serverIp = await GetServerIpAsync(ct);
        if (serverIp is null)
            return [];  // IP cannot be detected → silently ignore (server is behind egress/firewall)
        
        var warnings = new List<DryRunWarning>();
        foreach (var domain in domains)
        {
            IPAddress[] resolved;
            try
            {
                resolved =
                [
                    .. (await Dns.QueryAsync(domain, QueryType.A, cancellationToken: ct))
                    .Answers.ARecords().Select(r => r.Address)
                ];
            }
            catch
            {
                continue;
            }

            if (resolved.Length == 0 || resolved.Any(ip => !ip.Equals(serverIp)))
            {
                warnings.Add(new DryRunWarning(
                    domain,
                    [.. resolved.Select(ip => ip.ToString())],
                    serverIp.ToString()));
            }
        }
        return warnings;
    }

    private async Task<IPAddress?> GetServerIpAsync(CancellationToken ct)
    {
        try
        {
            return (await ipDetector.DetectAsync(PublicIpServices.Auto, false, ct)).IPv4;
        }
        catch
        {
            return null;
        }
    }
}