using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed class NoIpProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("noip", BcnProviderKind.Get, [
        new BcnCredentialField("username", BcnCredentialFieldType.Text),
        new BcnCredentialField("password", BcnCredentialFieldType.Secret)
    ]);

    protected override string BuildUrl(string hostname, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://dynupdate.no-ip.com/nic/update?hostname={hostname}&myip={ipv4}";

    protected override BcnUpdateResult Classify(string body) => body switch
    {
        "good" or "nochg" => new BcnUpdateResult(true),
        "badauth" => new BcnUpdateResult(false, BcnErrorCodes.InvalidCredentials),
        "nohost" => new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound),
        "abuse" => new BcnUpdateResult(false, BcnErrorCodes.AccountBlocked, RateLimited: true),
        "911" => new BcnUpdateResult(false, BcnErrorCodes.Unavailable, RateLimited: true),
        _ => new BcnUpdateResult(false, BcnErrorCodes.ProviderError),
    };
}