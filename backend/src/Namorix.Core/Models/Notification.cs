using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class Notification
{
    public int Id { get; init; }
    public int UserId { get; init; }
    
    [MaxLength(50)] public string Type { get; init; } = string.Empty;
    [MaxLength(200)] public string TitleKey { get; init; } = string.Empty;
    [MaxLength(200)] public string? DescriptionKey { get; init; }
    [MaxLength(500)] public string? Params { get; init; } // JSON: {"fileName":"report.pdf"}
    [MaxLength(100)] public string? Source { get; init; }
    
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; init; }
}