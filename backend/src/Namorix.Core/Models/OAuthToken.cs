using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class OAuthToken
{
    // Holds the signed access JWT for addon grants (~630 chars) and a GUID for
    // client_credentials machine tokens, so 200 was too small for the former.
    [Key]
    [MaxLength(1024)]
    public string TokenId { get; init; } = string.Empty;
    
    [MaxLength(100)] public string ClientId { get; init; } = string.Empty;

    public int UserId { get; init; }

    // The refresh chain this access token was minted for, empty for machine tokens.
    // Revoke is scoped by (userId, clientId, sessionId) so signing out of one addon
    // session does not revoke the user's other sessions on the same addon.
    [MaxLength(32)] public string SessionId { get; init; } = string.Empty;

    [MaxLength(500)] public string? Scope { get; init; }

    public DateTime ExpiresAt { get; init; }

    public bool Revoked { get; set; }
}