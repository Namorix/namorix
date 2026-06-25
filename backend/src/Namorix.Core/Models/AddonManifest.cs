using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class AddonManifest
{
    [MaxLength(100)] public string Id { get; init; } = string.Empty;
    [MaxLength(100)] public string DisplayName { get; set; } = string.Empty;
    [MaxLength(250)] public string? Description { get; init; }
    [MaxLength(500)] public string? Icon { get; init; }
    [MaxLength(200)] public string Image { get; init; } = string.Empty;

    public int HostPort { get; set; }

    [MaxLength(20)] public string? Status { get; set; }   // installed|running|stopped|error
    [MaxLength(50)] public string? Version { get; init; }
    [MaxLength(100)] public string? Author { get; init; }

    public DateTime InstalledAt { get; init; }

    [MaxLength(100)] public string? ClientId { get; set; }

    public string? PublicKey { get; set; }               // RSA public key (PEM)

    [MaxLength(500)] public string? RedirectUri { get; set; }
    [MaxLength(200)] public string? Scope { get; set; }
}