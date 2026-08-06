using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Frontgate;

public class FgCertificateDomain
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    
    [Required]
    [MaxLength(500)] public string Domain { get; init; } = string.Empty;
    
    [Required]
    public string CertificateId { get; init; } = string.Empty;
    public FgCertificate Certificate { get; init; } = null!;
}