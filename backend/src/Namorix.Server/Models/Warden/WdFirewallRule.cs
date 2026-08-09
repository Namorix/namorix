using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Warden;

public enum WdRuleAction { Allow, Deny }
public enum WdProtocol { Any, Tcp, Udp, Icmp }

public class WdFirewallRule
{
    [Key] public int Id { get; init; }

    [MaxLength(64)] public string Name { get; set; } = string.Empty;
    [MaxLength(64)] public string? SourceCidr { get; set; }   // null = any source
    [MaxLength(128)] public string? Ports { get; set; }       // "80,443" | "1-1024" | null = any port
    public WdProtocol Protocol { get; set; } = WdProtocol.Any;
    public WdRuleAction Action { get; set; } = WdRuleAction.Deny;

    public bool Enabled { get; set; } = true;
    public bool Auto { get; set; }                 // auto-deny from threshold
    public int? Priority { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}