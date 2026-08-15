using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Namorix.Core.AddonSession;

public sealed class AddonSessionService<TContext>(
    IDbContextFactory<TContext> dbFactory,
    IAddonTokenProtector protector,
    IOptions<AddonSessionAuthOptions> options) : IAddonSessionService
    where TContext : AddonSessionDbContext
{
    public async Task<AddonSession> CreateAsync(int userId, string clientId,
        string accessToken, string refreshToken, int expiresInSec, CancellationToken ct)
    {
        var session = new AddonSession
        {
            UserId = userId,
            ClientId = clientId,
            EncryptedAccessToken = protector.Protect(accessToken)!,
            EncryptedRefreshToken = protector.Protect(refreshToken)!,
            AccessTokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresInSec),
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(options.Value.SessionTtlDays),
        };

        await using var db = await dbFactory.CreateDbContextAsync(ct);
        db.Sessions.Add(session);
        await db.SaveChangesAsync(ct);
        return session;
    }

    public async Task<AddonSession?> FindAsync(string sessionId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Sessions.FindAsync([sessionId], ct);
    }

    public async Task UpdateTokensAsync(AddonSession session, string accessToken,
        string refreshToken, int expiresInSec, CancellationToken ct)
    {
        session.EncryptedAccessToken = protector.Protect(accessToken)!;
        session.EncryptedRefreshToken = protector.Protect(refreshToken)!;
        session.AccessTokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresInSec);
        session.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(options.Value.SessionTtlDays);
        session.LastSeenAt = DateTime.UtcNow;

        await using var db = await dbFactory.CreateDbContextAsync(ct);
        db.Sessions.Update(session);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(string sessionId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var session = await db.Sessions.FindAsync([sessionId], ct);
        if (session is not null)
        {
            db.Sessions.Remove(session);
            await db.SaveChangesAsync(ct);
        }
    }

    public string DecryptAccessToken(AddonSession session) =>
        protector.Unprotect(session.EncryptedAccessToken) ?? string.Empty;

    public string DecryptRefreshToken(AddonSession session) =>
        protector.Unprotect(session.EncryptedRefreshToken) ?? string.Empty;
}
