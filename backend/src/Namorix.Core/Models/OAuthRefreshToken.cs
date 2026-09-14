using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthRefreshToken
{
    public int Id { get; init; }

    [MaxLength(100)] public string ClientId { get; init; } = string.Empty;

    // Owner of the grant. Revoke is scoped by (UserId, *) per DG6, so a refresh token
    // without this cannot be attributed to the user who logged out.
    public int UserId { get; init; }

    [MaxLength(500)] public string TokenHash { get; init; } = string.Empty;
    
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public bool Used { get; set; }
}