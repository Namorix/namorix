using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Namorix.Core.AddonSession;

public sealed class AddonTokenStore<TContext>(
    IDbContextFactory<TContext> dbFactory,
    IAddonTokenProtector protector,
    IOptions<AddonSessionAuthOptions> options) : IAddonTokenStore
    where TContext : AddonSessionDbContext
{
    public async Task<AddonToken> CreateAsync(int userId, string clientId, string sessionId,
        string refreshToken, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var existing = await db.Tokens
            .FirstOrDefaultAsync(t => t.ClientId == clientId && t.SessionId == sessionId, ct);

        if (existing is null)
        {
            var created = new AddonToken
            {
                UserId = userId,
                ClientId = clientId,
                SessionId = sessionId,
                EncryptedRefreshToken = protector.Protect(refreshToken)!,
                RefreshTokenExpiresAt = RefreshExpiry(),
            };

            db.Tokens.Add(created);
            await db.SaveChangesAsync(ct);
            return created;
        }

        // Same session logging in again: this is a fresh grant, not an extra one.
        existing.UserId = userId;
        existing.EncryptedRefreshToken = protector.Protect(refreshToken)!;
        existing.RefreshTokenExpiresAt = RefreshExpiry();
        existing.LastSeenAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task<AddonToken?> FindAsync(int userId, string clientId, string sessionId,
        CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .FirstOrDefaultAsync(t => t.UserId == userId && t.ClientId == clientId
                && t.SessionId == sessionId, ct);
    }

    public async Task UpdateRefreshTokenAsync(AddonToken token, string refreshToken,
        CancellationToken ct)
    {
        token.EncryptedRefreshToken = protector.Protect(refreshToken)!;
        token.RefreshTokenExpiresAt = RefreshExpiry();
        token.LastSeenAt = DateTime.UtcNow;

        await using var db = await dbFactory.CreateDbContextAsync(ct);
        db.Tokens.Update(token);
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> DeleteAsync(int userId, string clientId, string sessionId,
        CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var token = await db.Tokens
            .FirstOrDefaultAsync(t => t.UserId == userId && t.ClientId == clientId
                && t.SessionId == sessionId, ct);

        if (token is null)
            return false;

        db.Tokens.Remove(token);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> DeleteUserSessionsAsync(int userId, string clientId,
        CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .Where(t => t.UserId == userId && t.ClientId == clientId)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<int> DeleteMissingSessionsAsync(string clientId,
        IReadOnlyCollection<AddonSessionRef> activeSessions, CancellationToken ct)
    {
        // SessionId is minted as a GUID, so matching on it alone cannot collide across
        // users; the clientId filter is what keeps this from reaching another addon's rows.
        var activeIds = activeSessions.Select(s => s.SessionId).ToArray();

        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .Where(t => t.ClientId == clientId && !activeIds.Contains(t.SessionId))
            .ExecuteDeleteAsync(ct);
    }

    public async Task<int> DeleteExpiredAsync(CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .Where(t => t.RefreshTokenExpiresAt <= DateTime.UtcNow)
            .ExecuteDeleteAsync(ct);
    }

    public async Task<int> DeleteOtherClientsAsync(string clientId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .Where(t => t.ClientId != clientId)
            .ExecuteDeleteAsync(ct);
    }

    public string DecryptRefreshToken(AddonToken token) =>
        protector.Unprotect(token.EncryptedRefreshToken) ?? string.Empty;

    private DateTime RefreshExpiry() =>
        DateTime.UtcNow.AddMinutes(options.Value.SessionTtlMinutes);
}
