using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Namorix.Server.Models;

public enum CertificateType
{
    Rsa,
    Ecdsa
}

public enum FgCertificateStatus { Active, Pending, Error }
public enum FgCertificateSource { LetsEncryptHttp, LetsEncryptDns, Custom }

public class FgCertificate
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    
    public ICollection<FgCertificateDomain> CertificateDomains { get; init; } = new List<FgCertificateDomain>();
    
    [MaxLength(50)] public string Issuer { get; init; } = "Let's Encrypt";
    
    public FgCertificateSource Source { get; init; } = FgCertificateSource.LetsEncryptHttp;
    
    public CertificateType Type { get; init; } = CertificateType.Rsa;
    
    public FgCertificateStatus Status { get; init; } = FgCertificateStatus.Active;
    
    [MaxLength(50)] public string? DnsProviderId { get; init; }

    public DateTime ExpiresAt { get; init; }
    public bool AutoRenew { get; init; } = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public ICollection<FgReverseProxyRule> ReverseProxyRules { get; init; } = new List<FgReverseProxyRule>();
}