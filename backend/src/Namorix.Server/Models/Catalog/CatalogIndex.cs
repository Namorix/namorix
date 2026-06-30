using System.Text.Json.Serialization;

namespace Namorix.Server.Models.Catalog;

public class CatalogIndex
{
    [JsonPropertyName("version")]
    public int Version { get; init; }

    [JsonPropertyName("ttl")]
    public int Ttl { get; init; }

    [JsonPropertyName("addons")]
    public List<CatalogIndexEntry> Addons { get; init; } = [];
}

public class CatalogIndexEntry
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("manifestUrl")]
    public string ManifestUrl { get; init; } = string.Empty;
}