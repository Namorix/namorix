using System.Text.Json.Serialization;

namespace Namorix.Server.Models.Catalog;

public class PortDto
{
    [JsonPropertyName("container")] public int Container { get; init; }
    [JsonPropertyName("protocol")] public string? Protocol { get; init; }
    [JsonPropertyName("description")] public string? Description { get; init; }
}