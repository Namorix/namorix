using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthToken
{
    [Key]
    [MaxLength(200)]
    public string TokenId { get; init; } = string.Empty;
    
    [MaxLength(100)] public string ClientId { get; init; } = string.Empty;

    public int UserId { get; init; }

    [MaxLength(500)] public string? Scope { get; init; }

    public DateTime ExpiresAt { get; init; }

    public bool Revoked { get; set; }
}