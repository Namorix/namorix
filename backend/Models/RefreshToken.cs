using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class RefreshToken
{
    public int Id { get; init; }
    public int UserId { get; init; }
    
    [MaxLength(100)]
    public string Jti { get; init; } = string.Empty;
    
    [MaxLength(500)]
    public string TokenHash { get; init; } = string.Empty;
    
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
    
    [MaxLength(1000)]
    public string? UserAgent { get; init; }
    
    [MaxLength(256)]
    public string? Fingerprint { get; init; }

    [MaxLength(50)]
    public string? IpAddress { get; init; }
    
    public DateTime? LastUsedAt { get; init; }
    public User? User { get; init; }
}