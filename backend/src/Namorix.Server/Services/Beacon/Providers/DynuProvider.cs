using System.Net;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Services.Beacon.Providers;

public sealed class DynuProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("dynu", BcnProviderKind.Get,
    [
        new BcnCredentialField(BcnCredentialParam.Username, BcnCredentialFieldType.Text),
        new BcnCredentialField(BcnCredentialParam.Password, BcnCredentialFieldType.Secret)
    ], HostIsDomain: true, Tested: true);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://api.dynu.com/nic/update?hostname={domain}&myip={ipv4}" +
        (ipv6 is null ? "" : $"&myipv6={ipv6}");

    protected override BcnUpdateResult Classify(string body)
    {
        var text = body.Trim();
        var parts = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var first = parts.Length > 0 ? parts[0] : text;

        return first switch
        {
            "good" or "nochg" => new BcnUpdateResult(true),
            "badauth" => new BcnUpdateResult(false, BcnErrorCodes.InvalidCredentials,
                new Dictionary<string, object?> { [BcnParam.Reason] = text }),
            "notfqdn" or "nohost" => new BcnUpdateResult(false, BcnErrorCodes.HostnameNotFound,
                new Dictionary<string, object?> { [BcnParam.Reason] = text }),
            "servererror" => new BcnUpdateResult(false, BcnErrorCodes.Unavailable,
                new Dictionary<string, object?> { [BcnParam.Reason] = text }),
            _ => new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
                new Dictionary<string, object?> { [BcnParam.Reason] = text }),
        };
    }
}