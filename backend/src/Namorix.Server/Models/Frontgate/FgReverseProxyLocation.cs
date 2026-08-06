using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models;

public class FgReverseProxyLocation
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    [MaxLength(32)] public string RuleId { get; init; } = string.Empty;
    public FgReverseProxyRule Rule { get; init; } = null!;
    [MaxLength(255)] public string Path { get; init; } = string.Empty;  // e.g. /webhook
    [MaxLength(20)] public string Scheme { get; init; } = "http";
    [MaxLength(253)] public string ForwardHost { get; init; } = string.Empty;
    public int ForwardPort { get; init; }
}