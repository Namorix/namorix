using System.ComponentModel.DataAnnotations;
using Namorix.Server.Models.Frontgate;

namespace Namorix.Server.Models;

public enum AccessPolicyType
{
    IpAllowlist,
    GeoBlock,
    BasicAuth
}

public class FgAccessPolicy
{
    [Key]
    [MaxLength(32)] public string Id { get; init; } = Guid.NewGuid().ToString("N");
    [MaxLength(100)] public string Name { get; init; } = string.Empty;    // "LAN only", "VN only"
    public AccessPolicyType Type { get; init; }
    public string RulesJson { get; init; } = "[]";   // JSON array
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public ICollection<FgReverseProxyRule> ReverseProxyRules { get; init; } = new List<FgReverseProxyRule>();
}