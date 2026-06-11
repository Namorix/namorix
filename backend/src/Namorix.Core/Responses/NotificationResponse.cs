namespace Namorix.Core.Responses;

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    
    public string? Params { get; set; }
    public string? Source { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Occurrences { get; set; }
    public DateTime LastOccurredAt { get; set; }
}