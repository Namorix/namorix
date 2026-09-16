namespace Namorix.Core.AddonSession;

// One row per session — the addon's proof that a user logged in here, from one place.
//
// The access token is not stored: it is a short-lived JWT the addon verifies locally
// against the desktop's public key, so keeping a copy would only add a second, staler
// source of truth. What must survive an addon restart is the refresh credential, because
// it is the only thing that can mint a new access token.
//
// A session is identified by (ClientId, SessionId) and that pair is unique, enforced by an
// index in AddonSessionDbContext. SessionId names the desktop's refresh chain, so two
// browsers signed in as the same user get two rows and can be signed out one at a time.
// UserId is kept alongside for filtering by owner and for the desktop's user-scoped pushes.
public class AddonToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string EncryptedRefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }
}
