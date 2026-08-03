using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class NamecheapProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("namecheap", BcnProviderKind.Get,
        [new BcnCredentialField("password", BcnCredentialFieldType.Secret)]);

    protected override string BuildUrl(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6)
    {
        var host = hostname.Split('.')[0];
        var domain = hostname[(host.Length + 1)..];
        return $"https://dynamicdns.park-your-domain.com/update?host={host}&domain={domain}&password={config.Password}&ip={ipv4}";
    }

    protected override BcnUpdateResult Classify(string body) =>
        body.Contains("<ErrCount>0</ErrCount>", StringComparison.OrdinalIgnoreCase)
            ? new BcnUpdateResult(true)
            : new BcnUpdateResult(false, BcnErrorCodes.ProviderError);

}