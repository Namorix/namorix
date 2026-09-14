namespace Namorix.Core.AddonSession;

// One row per (addon, user) grant — the addon's proof that a user logged in here.
//
// The access token is not stored: it is a short-lived JWT the addon verifies locally
// against the desktop's public key, so keeping a copy would only add a second, staler
// source of truth. What must survive an addon restart is the refresh credential, because
// it is the only thing that can mint a new access token.
//
// A grant is identified by (ClientId, UserId) and that pair is unique, enforced by an index
// in AddonSessionDbContext. DG9 is a separate, temporary rule on top: the addon currently
// refuses a grant for a second user, which AddonTokenStore enforces so two users' data
// cannot be mixed before the addon's own storage is partitioned per user.
public class AddonToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string EncryptedRefreshToken { get; set; } = string.Empty;
    public DateTime RefreshTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSeenAt { get; set; }
}
