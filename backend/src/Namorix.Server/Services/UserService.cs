using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Models;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public sealed record UserSummary(int Id, string Username, string Name);

public class UserService(AppDbContext appDbContext, ILogger<UserService> logger)
{
    // The addon channel's only way to learn who exists here. An empty query lists the
    // directory — that is what the share picker asks for — and a term narrows it. Lower-casing
    // both sides is what makes a search case-insensitive on SQLite, where LIKE is only
    // ASCII-insensitive and instr() is not insensitive at all.
    public async Task<List<UserSummary>> SearchAsync(
        string query, int limit, int offset = 0, CancellationToken ct = default)
    {
        var needle = query.ToLowerInvariant();

        // Branched rather than written as "needle is empty or matches", so an unfiltered list
        // does not carry three no-op lower-cases into the SQL.
        IQueryable<User> source = appDbContext.Users.AsNoTracking();
        if (needle.Length > 0)
            source = source.Where(u => u.Username.ToLower().Contains(needle)
                                       || u.Name.ToLower().Contains(needle)
                                       || u.Email.ToLower().Contains(needle));

        return await source
            .OrderBy(u => u.Username)
            .Skip(offset)
            .Take(limit)
            .Select(u => new UserSummary(u.Id, u.Username, u.Name))
            .ToListAsync(ct);
    }

    // The inverse of SearchAsync, for an addon holding ids it stored earlier. The caller names
    // the ids, so this discovers nobody; an id with no user is simply absent from the result
    // rather than reported as missing, since the caller can do nothing with that either way.
    public async Task<List<UserSummary>> GetByIdsAsync(
        IReadOnlyCollection<int> ids, CancellationToken ct = default)
    {
        if (ids.Count == 0) return [];

        // Materialised to a List because that is the Contains overload EF translates to an
        // IN clause; the interface type is not.
        var idList = ids.ToList();

        return await appDbContext.Users.AsNoTracking()
            .Where(u => idList.Contains(u.Id))
            .OrderBy(u => u.Username)
            .Select(u => new UserSummary(u.Id, u.Username, u.Name))
            .ToListAsync(ct);
    }

    public async Task UpdateProfileAsync(int userId, string email, string name)
    {
        var emailExists = await appDbContext.Users
            .AnyAsync(u => u.Email == email && u.Id != userId);
        
        if (emailExists)
            throw new AuthException(AuthErrors.EmailExists);
        
        var nameExists = await appDbContext.Users
            .AnyAsync(u => u.Name == name && u.Id != userId);
        
        if (nameExists)
            throw new AuthException(AuthErrors.NameExists);
        
        await appDbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Email, email)
                .SetProperty(u => u.Name, name));
    }
    
    public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        var user = await appDbContext.Users.FindAsync(userId);

        if (user == null)
            throw new AuthException(AuthErrors.Unauthorized);
        
        if (string.IsNullOrEmpty(user.Password) ||
            !BCrypt.Net.BCrypt.Verify(currentPassword, user.Password))
        {
            logger.LogWarning("Change password failed: wrong current password, userId={UserId}", userId);
            throw new AuthException(AuthErrors.IncorrectPassword);
        }

        logger.LogInformation("Password changed: userId={UserId}", userId);
        await appDbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s =>
                s.SetProperty(u => u.Password, BCrypt.Net.BCrypt.HashPassword(newPassword)));
    }
}