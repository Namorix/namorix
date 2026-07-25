using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthRefreshToken
{
    public int Id { get; init; }

    [MaxLength(100)] public string ClientId { get; init; } = string.Empty;
    [MaxLength(500)] public string TokenHash { get; init; } = string.Empty;
    
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool Used { get; set; }
}