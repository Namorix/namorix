using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class DuckDnsProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("duckdns", BcnProviderKind.Get,
        [new BcnCredentialField("token", BcnCredentialFieldType.Secret)]);

    protected override string BuildUrl(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://www.duckdns.org/update?domains={hostname.Split('.')[0]}&token={config.Token}&ip={ipv4}";

    protected override BcnUpdateResult Classify(string body) =>
        body.Trim().Equals("OK", StringComparison.OrdinalIgnoreCase)
            ? new BcnUpdateResult(true)
            : new BcnUpdateResult(false, BcnErrorCodes.ProviderError);
}