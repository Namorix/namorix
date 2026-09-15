using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Addon;

public class AddonInstallation
{
    [MaxLength(100)] public string Id { get; init; } = string.Empty;
    [MaxLength(100)] public string? ContainerId { get; set; }

    public int HostPort { get; set; }
    public string? Ports { get; set; }

    [MaxLength(200)] public string Image { get; set; } = string.Empty;
    [MaxLength(50)] public string? Version { get; set; }

    [MaxLength(20)] public string? Status { get; set; }   // installed|running|stopped|error

    [MaxLength(100)] public string? PendingTaskId { get; set; }
    [MaxLength(20)] public string? PendingTaskPhase { get; set; }
    [MaxLength(500)] public string? LastErrorCode { get; set; }
    public DateTime? LastStatusChangedAt { get; set; }
    public DateTime InstalledAt { get; init; }

    [MaxLength(100)] public string? ClientId { get; set; }
    public string? PublicKey { get; set; }               // RSA public key (PEM)
    [MaxLength(500)] public string? RedirectUri { get; set; }
    [MaxLength(200)] public string? Scope { get; set; }
}