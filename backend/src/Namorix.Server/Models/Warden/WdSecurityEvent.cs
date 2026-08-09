using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Warden;

public enum WdSeverity { Info, Warning, Critical }

public class WdSecurityEvent
{
    [Key] public int Id { get; init; }

    [MaxLength(32)] public string EventType { get; init; } = string.Empty;  // ACME_CHALLENGE_FAIL, SCAN_404...
    public WdSeverity Severity { get; init; } = WdSeverity.Info;

    [MaxLength(32)] public string SourceAddon { get; init; } = string.Empty;  // "frontgate", "auth"
    [MaxLength(64)] public string? SourceIp { get; init; } = string.Empty;

    public int Count { get; init; } = 1;
    public DateTime WindowStart { get; init; } = DateTime.UtcNow;

    public string? DetailJson { get; init; }   // path, status code, ...

    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}