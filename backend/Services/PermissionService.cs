using backend.Constants;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public class PermissionService(AppDbContext appDbContext, IMemoryCache memoryCache)
{
    private const string CachePermissionPrefix = "perms:";
        
    public async Task<bool> HasPermission(int userId, int permissionValue)
    {
        var user = await appDbContext.Users.FindAsync(userId);
        if (user == null)
            return false;

        if (user.Role == UserRole.Admin)
            return true;

        return await appDbContext.UserPermissions.AnyAsync(up =>
            up.UserId == userId &&
            up.Permission != null &&
            up.Permission.Value == permissionValue
        );
    }

    public async Task AssignPermission(int userId, int permissionValue)
    {
        var permission = await appDbContext.Permissions.FirstOrDefaultAsync(p => p.Value == permissionValue);
        if (permission == null)
            throw new KeyNotFoundException($"Permission value {permissionValue} not found");

        var exists = await appDbContext.UserPermissions.AnyAsync(up =>
            up.UserId == userId && up.PermissionId == permission.Id);
        if (exists)
            return;

        appDbContext.UserPermissions.Add(new UserPermission
        {
            UserId = userId,
            PermissionId = permission.Id,
            GrantedAt = DateTime.UtcNow
        });
        await appDbContext.SaveChangesAsync();
        InvalidateUserCache(userId);
    }

    public async Task RevokePermission(int userId, int permissionValue)
    {
        await appDbContext.UserPermissions
            .Where(up => up.UserId == userId && up.Permission != null && up.Permission.Value == permissionValue)
            .ExecuteDeleteAsync();
        InvalidateUserCache(userId);
    }

    public async Task<List<Permission>> GetAllPermissions()
    {
        return await appDbContext.Permissions.ToListAsync();
    }
    
    public async Task<List<string>> GetUserPermissions(int userId)
    {
        var user = await appDbContext.Users.FindAsync(userId);
        if (user == null)
            return [];
        
        if (user.Role == UserRole.Admin)
            return await appDbContext.Permissions.Select(p => p.Name).ToListAsync();

        var cacheKey = CachePermissionPrefix + userId;
        return await memoryCache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Time.ExpirationRelativeToNow;
            return await appDbContext.UserPermissions
                .Where(up => up.UserId == userId && up.Permission != null)
                .Select(up => up.Permission!.Name)
                .ToListAsync();
        }) ?? [];
    }

    public async Task CreatePermission(string name, int value, string? description)
    {
        if (await appDbContext.Permissions.AnyAsync(p => p.Name == name || p.Value == value))
            return;

        appDbContext.Permissions.Add(new Permission
        {
            Name = name,
            Value = value,
            Description = description
        });
        await appDbContext.SaveChangesAsync();
    }

    public async Task DeletePermission(int value)
    {
        var permission = await appDbContext.Permissions.FirstOrDefaultAsync(p => p.Value == value);
        if (permission == null)
            return;

        await appDbContext.UserPermissions
            .Where(up => up.PermissionId == permission.Id)
            .ExecuteDeleteAsync();
        await appDbContext.SaveChangesAsync();
    }

    private void InvalidateUserCache(int userId)
    {
        memoryCache.Remove(CachePermissionPrefix + userId);
    }
}