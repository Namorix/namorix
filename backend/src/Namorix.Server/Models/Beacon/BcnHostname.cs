using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Namorix.Server.Models;

public enum BcnProviderKind { Get, Rest, Custom }
public enum BcnHostnameStatus { Updating, Active, Disabled, Error }

public class BcnHostname
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");

    [Required]
    [MaxLength(253)] public string Host { get; set; } = string.Empty;   // "@,www,home" (comma list)
    [Required]
    [MaxLength(253)] public string Domain { get; set; } = string.Empty; // "example.com"

    [NotMapped]
    public string DisplayName => Host == Domain ? Domain : $"{Host} · {Domain}";

    [Required]
    [MaxLength(32)] public string ProviderId { get; set; } = string.Empty;

    public BcnProviderKind Kind { get; set; } = BcnProviderKind.Get;

    [Required]
    public string ConfigJson { get; set; } = "{}";          // BcnProviderConfig serialize

    public BcnHostnameStatus Status { get; set; } = BcnHostnameStatus.Active;

    [MaxLength(45)] public string? CurrentIpv4 { get; set; }
    [MaxLength(45)] public string? CurrentIpv6 { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
    public string? LastError { get; set; }
    public DateTime? BackoffUntil { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}