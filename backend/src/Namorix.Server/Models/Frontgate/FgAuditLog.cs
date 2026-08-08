using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Frontgate;

public enum FgAuditTargetType { Rule, Cert, Policy, Audit }

public enum FgAuditAction
{
    Created,
    Updated,
    Deleted,
    DryRunConfirm,
    DryRunCancel,
    DryRunExpire,
    CertRetry,
    CertRenew,
    AuditCleared
}

public class FgAuditLog
{
    [Key]
    public long Id { get; init; } 

    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    [MaxLength(64)]
    public string Actor { get; init; } = string.Empty;

    [MaxLength(32)]
    public string? ActorId { get; init; }

    [MaxLength(45)]
    public string? ClientIp { get; init; }

    public FgAuditTargetType TargetType { get; init; }
    [MaxLength(32)]
    public string? TargetId { get; init; }
    [MaxLength(253)]
    public string? TargetName { get; init; }

    public FgAuditAction Action { get; init; }

    [MaxLength(8192)]
    public string? BeforeJson { get; init; }

    [MaxLength(8192)]
    public string? AfterJson { get; init; }
}