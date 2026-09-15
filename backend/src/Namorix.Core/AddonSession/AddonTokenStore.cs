using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Namorix.Core.AddonSession;

public sealed class AddonTokenStore<TContext>(
    IDbContextFactory<TContext> dbFactory,
    IAddonTokenProtector protector,
    IOptions<AddonSessionAuthOptions> options) : IAddonTokenStore
    where TContext : AddonSessionDbContext
{
    public async Task<AddonToken?> CreateAsync(int userId, string clientId,
        string refreshToken, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var existing = await db.Tokens
            .FirstOrDefaultAsync(t => t.ClientId == clientId, ct);

        if (existing is not null && existing.UserId != userId)
            return null;

        if (existing is not null)
        {
            // Same user logging in again: this is a fresh grant, not an extra one.
            existing.EncryptedRefreshToken = protector.Protect(refreshToken)!;
            existing.RefreshTokenExpiresAt = RefreshExpiry();
            existing.LastSeenAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return existing;
        }

        var token = new AddonToken
        {
            UserId = userId,
            ClientId = clientId,
            EncryptedRefreshToken = protector.Protect(refreshToken)!,
            RefreshTokenExpiresAt = RefreshExpiry(),
        };

        db.Tokens.Add(token);
        await db.SaveChangesAsync(ct);
        return token;
    }

    public async Task<AddonToken?> FindAsync(int userId, string clientId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .FirstOrDefaultAsync(t => t.UserId == userId && t.ClientId == clientId, ct);
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

    public async Task<bool> DeleteAsync(int userId, string clientId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var token = await db.Tokens
            .FirstOrDefaultAsync(t => t.UserId == userId && t.ClientId == clientId, ct);

        if (token is null)
            return false;

        db.Tokens.Remove(token);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> DeleteMissingAsync(string clientId,
        IReadOnlyCollection<int> activeUserIds, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var stale = await db.Tokens
            .Where(t => t.ClientId == clientId && !activeUserIds.Contains(t.UserId))
            .ToListAsync(ct);

        if (stale.Count == 0)
            return 0;

        db.Tokens.RemoveRange(stale);
        await db.SaveChangesAsync(ct);
        return stale.Count;
    }

    public async Task<IReadOnlyList<int>> ListUserIdsAsync(string clientId, CancellationToken ct)
    {
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        return await db.Tokens
            .Where(t => t.ClientId == clientId)
            .Select(t => t.UserId)
            .ToListAsync(ct);
    }

    public string DecryptRefreshToken(AddonToken token) =>
        protector.Unprotect(token.EncryptedRefreshToken) ?? string.Empty;

    private DateTime RefreshExpiry() =>
        DateTime.UtcNow.AddMinutes(options.Value.SessionTtlMinutes);
}
