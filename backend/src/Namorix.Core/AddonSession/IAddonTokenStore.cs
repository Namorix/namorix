namespace Namorix.Core.AddonSession;

public interface IAddonTokenStore
{
    // Stores the grant for one login. Several users may hold grants on the same addon at
    // once; the owner column in the addon's own storage is what keeps their data apart.
    Task<AddonToken> CreateAsync(int userId, string clientId, string sessionId,
        string refreshToken, CancellationToken ct);

    Task<AddonToken?> FindAsync(int userId, string clientId, string sessionId, CancellationToken ct);

    // Persists the rotated refresh token. Callers must await this before answering the
    // request that consumed the previous one: a crash between the desktop's rotation and
    // this write would leave the addon unable to refresh with the only token it still has.
    Task UpdateRefreshTokenAsync(AddonToken token, string refreshToken, CancellationToken ct);

    Task<bool> DeleteAsync(int userId, string clientId, string sessionId, CancellationToken ct);

    // Drops every session this user holds on this addon. The desktop's revocation push is
    // user-scoped (logout-all), so one message has to clear all of that user's sessions.
    Task<int> DeleteUserSessionsAsync(int userId, string clientId, CancellationToken ct);

    // Drops every session of this client that is not in activeSessions. Used when the
    // desktop answers what it still considers live, which covers revocations whose push
    // the addon was offline for. Session-scoped rather than user-scoped: a session signed
    // out while we were down must go even though the same user has other sessions left.
    Task<int> DeleteMissingSessionsAsync(string clientId,
        IReadOnlyCollection<AddonSessionRef> activeSessions, CancellationToken ct);

    Task<int> DeleteExpiredAsync(CancellationToken ct);

    // Drops grants left behind by a ClientId the addon no longer holds. Every other delete
    // here is scoped to the current ClientId, which is what made those rows unreachable.
    Task<int> DeleteOtherClientsAsync(string clientId, CancellationToken ct);

    string DecryptRefreshToken(AddonToken token);
}
