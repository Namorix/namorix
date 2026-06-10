using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Namorix.Adapters.Persistence;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class UserSettingsService(AppDbContext dbContext, IMemoryCache memoryCache,
    IUserSettingsNotifier userSettingsNotifier)
{
    private const string CacheKeyPrefix = "user_settings_";
    
    public async Task<Dictionary<string, string>> GetAllAsync(int userId)
    {
        return await memoryCache.GetOrCreateAsync(GetCacheKeyUser(userId), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Time.ExpirationRelativeToNow;
            return await dbContext.UserSettings
                .Where(s => s.UserId == userId)
                .ToDictionaryAsync(s => s.Key, s => s.Value);
        }) ?? new Dictionary<string, string>();    }

    public async Task SetAsync(int userId, string key, string value)
    {
        var setting = await dbContext.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Key == key);
        if (setting != null)
            setting.Value = value;
        else
            dbContext.UserSettings.Add(new UserSetting() { UserId = userId, Key = key, Value = value });
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(GetCacheKeyUser(userId));
        await userSettingsNotifier.NotifyUserSettingsChangedAsync(userId);
    }

    public async Task SetBatchAsync(int userId, Dictionary<string, string> settings)
    {
        var existing = await dbContext.UserSettings
            .Where(s => s.UserId == userId)
            .ToListAsync();
        
        foreach (var (key, value) in settings)
        {
            var setting = existing.FirstOrDefault(s => s.Key == key);
            if (setting != null)
                setting.Value = value;
            else
                dbContext.UserSettings.Add(new UserSetting { UserId = userId, Key = key, Value = value });
        }
        
        await dbContext.SaveChangesAsync();
        memoryCache.Remove(GetCacheKeyUser(userId));
        await userSettingsNotifier.NotifyUserSettingsChangedAsync(userId);
    }

    private static string GetCacheKeyUser(int userId) =>
        $"{CacheKeyPrefix}{userId}";
}