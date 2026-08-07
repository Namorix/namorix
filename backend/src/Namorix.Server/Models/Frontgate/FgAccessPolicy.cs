using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Frontgate;

public enum AccessPolicyType
{
    IpAllowlist,
    GeoBlock,
    BasicAuth,
    IpDenylist
}

public class FgAccessPolicy
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    [MaxLength(100)] public string Name { get; set; } = string.Empty;    // "LAN only", "VN only"
    public AccessPolicyType Type { get; set; }
    public string RulesJson { get; set; } = "[]";   // JSON array
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public ICollection<FgReverseProxyRule> ReverseProxyRules { get; init; } = new List<FgReverseProxyRule>();
}

public record FgBasicAuthPolicy(string Username, string PasswordHash);
