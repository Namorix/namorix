using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class DuckDnsProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("duckdns", BcnProviderKind.Get,
        [new BcnCredentialField(BcnCredentialParam.Token, BcnCredentialFieldType.Secret)], Tested: true);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://www.duckdns.org/update?domains={host}&token={config.Token}&ip={ipv4}" +
        (ipv6 is null ? "" : $"&ipv6={ipv6}");

    protected override BcnUpdateResult Classify(string body) =>
        body.Trim().Equals("OK", StringComparison.OrdinalIgnoreCase)
            ? new BcnUpdateResult(true)
            : new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
                new Dictionary<string, object?> { [BcnParam.Reason] = body.Trim() });
}