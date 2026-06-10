namespace Namorix.Core.Responses;

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TitleKey { get; set; } = string.Empty;
    public string? DescriptionKey { get; set; }
    public string? Params { get; set; }
    public string? Source { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}