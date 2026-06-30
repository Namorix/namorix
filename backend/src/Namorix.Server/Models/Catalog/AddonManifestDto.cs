using System.Text.Json.Serialization;

namespace Namorix.Server.Models.Catalog;

public class AddonManifestDto
{
    [JsonPropertyName("id")] public string Id { get; init; } = string.Empty;
    [JsonPropertyName("name")] public string Name { get; init; } = string.Empty;
    [JsonPropertyName("description")] public string? Description { get; init; }
    [JsonPropertyName("version")] public string Version { get; init; } = string.Empty;
    [JsonPropertyName("author")] public string? Author { get; init; }
    [JsonPropertyName("category")] public string? Category { get; init; }
    [JsonPropertyName("icon")] public string? Icon { get; init; }
    [JsonPropertyName("repo")] public string? Repo { get; init; }
    [JsonPropertyName("license")] public string? License { get; init; }
    [JsonPropertyName("image")] public string Image { get; init; } = string.Empty;
    [JsonPropertyName("imageTag")] public string? ImageTag { get; init; }
    [JsonPropertyName("arch")] public List<string>? Arch { get; init; }
    [JsonPropertyName("ports")] public List<PortDto>? Ports { get; init; }
    [JsonPropertyName("boot")] public string? Boot { get; init; }
    [JsonPropertyName("minCoreVersion")] public string? MinCoreVersion { get; init; }
    [JsonPropertyName("minServerVersion")] public string? MinServerVersion { get; init; }
}