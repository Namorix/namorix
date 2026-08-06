using System.Net;
using System.Text.RegularExpressions;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;

namespace Namorix.Server.Services.Beacon.Providers;

public sealed partial class NamecheapProvider(IHttpClientFactory httpFactory) : BcnGetProviderBase(httpFactory)
{
    public override BcnProviderInfo Info => new("namecheap", BcnProviderKind.Get,
        [new BcnCredentialField(BcnCredentialParam.Password, BcnCredentialFieldType.Secret)], Tested: true);

    protected override string BuildUrl(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6) =>
        $"https://dynamicdns.park-your-domain.com/update?host={host}&domain={domain}&password={config.Password}&ip={ipv4}";

    public override async Task<BcnUpdateResult> UpdateAsync(string host, string domain, BcnProviderConfig config,
        IPAddress? ipv4, IPAddress? ipv6, CancellationToken ct)
    {
        BcnUpdateResult? firstFailure = null;
        foreach (var tag in host.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var result = await base.UpdateAsync(tag, domain, config, ipv4, ipv6, ct);
            if (!result.Success)
                firstFailure ??= result with { Params = WithHostname(result.Params, tag) };
        }
        return firstFailure ?? new BcnUpdateResult(true);
    }
    
    private static Dictionary<string, object?>? WithHostname(Dictionary<string, object?>? p, string name)
    {
        var dict = new Dictionary<string, object?>(p ?? new Dictionary<string, object?>());
        dict.TryAdd(BcnParam.Hostname, name);
        return dict;
    }
    
    protected override BcnUpdateResult Classify(string body)
    {
        if (body.Contains("<ErrCount>0</ErrCount>", StringComparison.OrdinalIgnoreCase))
            return new BcnUpdateResult(true);
        var reason = ExtractErr1(body);
        return new BcnUpdateResult(false, BcnErrorCodes.ProviderError,
            new Dictionary<string, object?> { [BcnParam.Reason] = reason ?? body.Trim() });
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