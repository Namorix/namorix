using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models;

public enum ProxyAccessMode
{
    Public,
    Private,
    Restricted,   // Assign a specific AccessList (IP allowlist/geo-block)
    BasicAuth
}

public enum ProxyRuleStatus
{
    Inactive,
    Active,
    Error
}

public class FgReverseProxyRule
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    [MaxLength(253)] public string Source { get; set; } = string.Empty; // 253 = actual hostname length limit per RFC 1035

    [MaxLength(20)] public string DestinationScheme { get; set; } = "http";
    [MaxLength(253)] public string DestinationHost { get; set; } = string.Empty;
    public int DestinationPort { get; set; } = 80;
    
    [MaxLength(32)] public string? CertificateId { get; init; }
    public FgCertificate? Certificate { get; init; }
    
    public ProxyAccessMode Access { get; set; } = ProxyAccessMode.Private;
    [MaxLength(32)] public string? AccessPolicyId { get; init; }
    public FgAccessPolicy? AccessPolicy { get; init; }
    
    public bool WebSocketsSupport { get; set; } = true;
    public bool CacheAssets { get; set; }
    public bool ForceSsl { get; set; }
    public bool Http2Support { get; set; }
    public bool HstsEnabled { get; set; }
    public bool HstsSubdomains { get; set; }
    public bool TrustForwardedProtoHeaders { get; set; } = true;
    public bool BlockCommonExploits { get; set; }
    
    public string? AdditionalHeadersJson { get; set; }

    public ProxyRuleStatus Status { get; set; } = ProxyRuleStatus.Inactive;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    public ICollection<FgReverseProxyLocation>? Locations { get; set; }
}