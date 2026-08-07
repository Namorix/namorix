namespace Namorix.Server.Models.Frontgate;

public record FgRuleSnapshot(
    string Source, string DestinationScheme, string DestinationHost, int DestinationPort,
    string? CertificateId, string? AccessPolicyId, string Access, string Status,
    bool WebSocketsSupport, bool CacheAssets, bool ForceSsl, bool Http2Support,
    bool HstsEnabled, bool HstsSubdomains, bool TrustForwardedProtoHeaders,
    bool BlockCommonExploits, string? AdditionalHeadersJson, List<LocationSnapshot>? Locations)
{
    public static FgRuleSnapshot From(FgReverseProxyRule rule) => new(
        rule.Source, rule.DestinationScheme, rule.DestinationHost, rule.DestinationPort,
        rule.CertificateId, rule.AccessPolicyId, rule.Access.ToString(), rule.Status.ToString(),
        rule.WebSocketsSupport, rule.CacheAssets, rule.ForceSsl, rule.Http2Support,
        rule.HstsEnabled, rule.HstsSubdomains, rule.TrustForwardedProtoHeaders,
        rule.BlockCommonExploits, rule.AdditionalHeadersJson,
        rule.Locations?.Select(l => new LocationSnapshot(l.Path, l.Scheme, l.ForwardHost, l.ForwardPort)).ToList());

    public void ApplyTo(FgReverseProxyRule rule)
    {
        rule.Source = Source; rule.DestinationScheme = DestinationScheme;
        rule.DestinationHost = DestinationHost; rule.DestinationPort = DestinationPort;
        rule.CertificateId = CertificateId; rule.AccessPolicyId = AccessPolicyId;
        rule.Access = Enum.Parse<ProxyAccessMode>(Access, ignoreCase: true);
        rule.Status = Enum.Parse<ProxyRuleStatus>(Status, ignoreCase: true);
        rule.WebSocketsSupport = WebSocketsSupport; rule.CacheAssets = CacheAssets;
        rule.ForceSsl = ForceSsl; rule.Http2Support = Http2Support;
        rule.HstsEnabled = HstsEnabled; rule.HstsSubdomains = HstsSubdomains;
        rule.TrustForwardedProtoHeaders = TrustForwardedProtoHeaders;
        rule.BlockCommonExploits = BlockCommonExploits;
        rule.AdditionalHeadersJson = AdditionalHeadersJson;
        rule.Locations = Locations?.Select(l => new FgReverseProxyLocation
        { RuleId = rule.Id, Path = l.Path, Scheme = l.Scheme, ForwardHost = l.ForwardHost, ForwardPort = l.ForwardPort }).ToList() ?? [];
    }
}
public record LocationSnapshot(string Path, string Scheme, string ForwardHost, int ForwardPort);