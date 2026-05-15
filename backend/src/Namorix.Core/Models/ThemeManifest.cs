using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class ThemeManifest
{
    [MaxLength(100)]
    public string Id { get; init; } = string.Empty;
    
    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;
    
    [MaxLength(10)]
    public string Version { get; init; } = string.Empty;
    
    [MaxLength(50)]
    public string Author { get; init; } = string.Empty;
    
    [MaxLength(250)]
    public string Description { get; init; } = string.Empty;
    
    [MaxLength(500)]
    public string Preview { get; init; } = string.Empty;
    
    [MaxLength(250)]
    public string Css { get; init; } = string.Empty;
    
    public List<string> Tags { get; init; } = [];
    public bool IsBuiltIn { get; init; } = true;
}