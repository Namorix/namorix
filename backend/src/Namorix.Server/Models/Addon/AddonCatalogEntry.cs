using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Addon;

public class AddonCatalogEntry
{
    [MaxLength(100)] public string Id { get; init; } = string.Empty;
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(50)] public string Version { get; set; } = string.Empty;
    [MaxLength(100)] public string? Author { get; set; }
    [MaxLength(50)] public string? Category { get; set; }
    [MaxLength(500)] public string? Icon { get; set; }
    [MaxLength(500)] public string? Repo { get; set; }
    [MaxLength(50)] public string? License { get; set; }

    [MaxLength(200)] public string Image { get; set; } = string.Empty;
    [MaxLength(50)] public string? ImageTag { get; set; }
    [MaxLength(500)] public string? Arch { get; set; }           // JSON array — ["amd64", "arm64"]
    // TODO: It is worth noting that storing a JSON array doesn't seem quite right.
    [MaxLength(500)] public string? Ports { get; set; }           // JSON array — [{"container":5100,"protocol":"tcp"}]

    [MaxLength(20)] public string? Boot { get; set; }          // "manual" | "auto"
    [MaxLength(20)] public string? MinCoreVersion { get; set; }
    [MaxLength(20)] public string? MinServerVersion { get; set; }

    [MaxLength(500)] public string ManifestUrl { get; set; } = string.Empty;
    public DateTime CachedAt { get; set; }
    public bool IsOrphaned { get; set; }
}