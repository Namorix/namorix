namespace Namorix.Core.AddonSession;

public interface IAddonSessionService
{
    Task<AddonSession> CreateAsync(int userId, string clientId,
        string accessToken, string refreshToken, int expiresInSec, CancellationToken ct);
    Task<AddonSession?> FindAsync(string sessionId, CancellationToken ct);
    Task UpdateTokensAsync(AddonSession session, string accessToken,
        string refreshToken, int expiresInSec, CancellationToken ct);
    Task DeleteAsync(string sessionId, CancellationToken ct);
    string DecryptAccessToken(AddonSession session);
    string DecryptRefreshToken(AddonSession session);
}
