using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class Notification
{
    public int Id { get; init; }
    public int UserId { get; init; }
    
    [MaxLength(50)] public string Type { get; init; } = string.Empty;
    [MaxLength(200)] public string Key { get; init; } = string.Empty;
    [MaxLength(500)] public string? Params { get; set; } // JSON: {"fileName":"report.pdf"}
    [MaxLength(100)] public string? Source { get; init; }
    
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; init; }

    public int Occurrences { get; set; } = 1;
    public DateTime LastOccurredAt { get; set; }
}