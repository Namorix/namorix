using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class TrafficEndpoint
{
    public int Id { get; init; }

    [MaxLength(20)]
    public string Method { get; init; } = string.Empty;

    [MaxLength(500)]
    public string Path { get; init; } = string.Empty;

    [MaxLength(200)]
    public string? Label { get; init; }
    
    [MaxLength(100)]
    public string? AddonId { get; init; }
    public AddonManifest? Addon { get; init; }
    
    public bool IsEnabled { get; init; } = true;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}