using System.Net;
using System.Text.RegularExpressions;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;

namespace Namorix.Server.Services.BcnProviders;

public sealed partial class NamecheapProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("namecheap", BcnProviderKind.Get,
        [new BcnCredentialField("password", BcnCredentialFieldType.Secret)], true);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://dynamicdns.park-your-domain.com/update?host={host}&domain={domain}&password={config.Password}&ip={ipv4}";

    protected override BcnUpdateResult Classify(string body)
    {
        if (body.Contains("<ErrCount>0</ErrCount>", StringComparison.OrdinalIgnoreCase))
            return new BcnUpdateResult(true);
        var reason = ExtractErr1(body);
        return new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
            new Dictionary<string, object?> { ["reason"] = reason ?? body.Trim() });
    }
    
    private static string? ExtractErr1(string body)
    {
        var match = MyRegex().Match(body);
        return match.Success
            ? WebUtility.HtmlDecode(match.Groups[1].Value.Trim())
            : null;
    }

    [GeneratedRegex(@"<Err1>(.*?)</Err1>", RegexOptions.IgnoreCase | RegexOptions.Singleline, "en-US")]
    private static partial Regex MyRegex();
}