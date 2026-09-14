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

    // Rotation successor, recorded on the token we just marked Used so a retry arriving
    // inside RefreshReuseGraceSeconds can be answered with the same pair instead of
    // being read as theft. The refresh half is encrypted at rest and nothing else ever
    // reads it back.
    [MaxLength(1024)] public string? ReplacedByAccessTokenId { get; set; }
    [MaxLength(500)] public string? EncryptedReplacedRefreshToken { get; set; }
    public DateTime? ReplacedAt { get; set; }
}