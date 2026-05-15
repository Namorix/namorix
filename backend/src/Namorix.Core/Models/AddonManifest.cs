using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class AddonManifest
{
    [MaxLength(100)]
    public string Id { get; init; } = string.Empty;
    
    [MaxLength(100)]
    public string DisplayName { get; init; } = string.Empty;
    
    [MaxLength(250)]
    public string? Description { get; init; }
    
    [MaxLength(500)]
    public string? Icon { get; init; }
}