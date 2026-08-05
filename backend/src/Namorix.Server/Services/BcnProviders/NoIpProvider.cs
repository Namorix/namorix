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
    ], HostIsDomain: true);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://dynupdate.no-ip.com/nic/update?hostname={domain}&myip={ipv4}" +
        (ipv6 is null ? "" : $"&myipv6={ipv6}");

    protected override BcnUpdateResult Classify(string body)
    {
        var text = body.Trim();
        return text switch
        {
            "good" or "nochg" => new BcnUpdateResult(true),
            "badauth" => new BcnUpdateResult(false, BcnErrorCodes.InvalidCredentials,
                new Dictionary<string, object?> { ["reason"] = text }),
            "nohost" => new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound,
                new Dictionary<string, object?> { ["reason"] = text }),
            "abuse" => new BcnUpdateResult(false, BcnErrorCodes.AccountBlocked,
                new Dictionary<string, object?> { ["reason"] = text }, RateLimited: true),
            "911" => new BcnUpdateResult(false, BcnErrorCodes.Unavailable,
                new Dictionary<string, object?> { ["reason"] = text }, RateLimited: true),
            _ => new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
                new Dictionary<string, object?> { ["reason"] = text }),
        };
    }
}