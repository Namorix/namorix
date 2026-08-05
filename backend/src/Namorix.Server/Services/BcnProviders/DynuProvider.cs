using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class DynuProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("dynu", BcnProviderKind.Get,
    [
        new BcnCredentialField("username", BcnCredentialFieldType.Text),
        new BcnCredentialField("password", BcnCredentialFieldType.Secret)
    ]);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://api.dynu.com/nic/update?hostname={domain}&myip={ipv4}" +
        (ipv6 is null ? "" : $"&myipv6={ipv6}");

    protected override BcnUpdateResult Classify(string body) => body switch
    {
        "good" or "nochg" => new BcnUpdateResult(true),
        "badauth" => new BcnUpdateResult(false, BcnErrorCodes.InvalidCredentials),
        "nohost" => new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound),
        _ => new BcnUpdateResult(false, BcnErrorCodes.ProviderError),
    };
}