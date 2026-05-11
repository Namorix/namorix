namespace backend.Models;

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Jti { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserAgent { get; set; }
    public string? Fingerprint { get; set; }
    public string? IpAddress { get; set; }
    public DateTime? LastUsedAt { get; set; }

    public User? User { get; set; } = null;
}