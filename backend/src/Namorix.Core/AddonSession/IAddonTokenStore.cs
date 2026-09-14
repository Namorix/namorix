namespace Namorix.Core.AddonSession;

public interface IAddonTokenStore
{
    // Returns null when the addon already holds a grant for a different user (DG9).
    Task<AddonToken?> CreateAsync(int userId, string clientId, string refreshToken,
        CancellationToken ct);

    Task<AddonToken?> FindAsync(int userId, string clientId, CancellationToken ct);

    // Persists the rotated refresh token. Callers must await this before answering the
    // request that consumed the previous one: a crash between the desktop's rotation and
    // this write would leave the addon unable to refresh with the only token it still has.
    Task UpdateRefreshTokenAsync(AddonToken token, string refreshToken, CancellationToken ct);

    Task<bool> DeleteAsync(int userId, string clientId, CancellationToken ct);

    // Drops every grant of this client whose user is not in activeUserIds. Used when the
    // desktop answers what it still considers live, which covers revocations whose push
    // the addon was offline for.
    Task<int> DeleteMissingAsync(string clientId, IReadOnlyCollection<int> activeUserIds,
        CancellationToken ct);

    Task<IReadOnlyList<int>> ListUserIdsAsync(string clientId, CancellationToken ct);

    string DecryptRefreshToken(AddonToken token);
}
