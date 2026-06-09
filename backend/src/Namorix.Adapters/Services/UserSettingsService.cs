using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Namorix.Adapters.Persistence;
using Namorix.Core.Models;

namespace Namorix.Adapters.Services;

public class UserSettingsService(AppDbContext dbContext, ILogger<UserSettingsService> logger)
{
    public async Task<Dictionary<string, string>> GetAllAsync(int userId)
    {
        return await dbContext.UserSettings
            .Where(s => s.UserId == userId)
            .ToDictionaryAsync(s => s.Key, s => s.Value);
    }

    public async Task SetAsync(int userId, string key, string value)
    {
        var setting = await dbContext.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Key == key);
        if (setting != null)
            setting.Value = value;
        else
            dbContext.UserSettings.Add(new UserSetting() { UserId = userId, Key = key, Value = value });
        await dbContext.SaveChangesAsync();
    }

    public async Task SetBatchAsync(int userId, Dictionary<string, string> settings)
    {
        foreach (var (key, value) in settings)
            await SetAsync(userId, key, value);
    }
}