using System.Net;
using DnsClient;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services.Beacon.Providers;

public static class AuthoritativeDnsResolver
{
    public static async Task<BcnCurrentRecord?> ResolveAsync(string hostname, CancellationToken ct)
    {
        var nsIp = await ResolveAuthoritativeNsIpAsync(hostname, ct);
        if (nsIp is null)
            return null;
        
        var authoritative = new LookupClient(new LookupClientOptions(new[] { new NameServer(nsIp) })
        {
            UseCache = false
        });

        var a = await authoritative.QueryAsync(hostname, QueryType.A, cancellationToken: ct);
        var aaaa = await authoritative.QueryAsync(hostname, QueryType.AAAA, cancellationToken: ct);
        
        return new BcnCurrentRecord(
            a.Answers.ARecords().FirstOrDefault()?.Address?.ToString(),
            aaaa.Answers.AaaaRecords().FirstOrDefault()?.Address?.ToString());
    }

    private static async Task<IPAddress?> ResolveAuthoritativeNsIpAsync(string hostname, CancellationToken ct)
    {
        var bootstrap = new LookupClient(NameServer.GooglePublicDns);
        var labels = hostname.Split('.');
        for (var i = 0; i < labels.Length - 1; i++)
        {
            var zone = string.Join('.', labels.Skip(i));
            var ns = await bootstrap.QueryAsync(zone, QueryType.NS, cancellationToken: ct);
            var nsName = ns.Answers.NsRecords().FirstOrDefault()?.NSDName?.Value;
            if (nsName is null) continue;
            var nsIp = (await bootstrap.QueryAsync(nsName, QueryType.A, cancellationToken: ct))
                .Answers.ARecords().FirstOrDefault()?.Address;
            if (nsIp is not null) return nsIp;
        }
        return null;
    }
}