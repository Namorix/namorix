using backend.Constants;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public class SettingsService(AppDbContext dbContext, IMemoryCache memoryCache)
{
    private static readonly TimeSpan ExpirationRelativeToNow = TimeSpan.FromMinutes(5);
    
    public async Task<bool> IsRegisterEnabled()
    {
        return await memoryCache.GetOrCreateAsync(SettingKeys.RegisterEnabled, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ExpirationRelativeToNow;
            var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.RegisterEnabled);
            return setting?.Value.Equals(SettingValues.True, StringComparison.OrdinalIgnoreCase) ?? true;
        });
    }

    public async Task SetRegisterEnabled(bool enabled)
    {
        var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.RegisterEnabled);
        if (setting == null)
        {
            setting = new Setting { Key = SettingKeys.RegisterEnabled, Value = enabled ? SettingValues.True : SettingValues.False };
            dbContext.Settings.Add(setting);
        }
        else
        {
            setting.Value = enabled ? SettingValues.True : SettingValues.False;
        }

        await dbContext.SaveChangesAsync();
        memoryCache.Set(SettingKeys.RegisterEnabled, enabled, ExpirationRelativeToNow);
    }

    public async Task<List<string>> GetTrustedProxies()
    {
        var value = await memoryCache.GetOrCreateAsync(SettingKeys.TrustedProxies, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = ExpirationRelativeToNow;
            var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.TrustedProxies);
            return setting?.Value ?? "";
        });

        return string.IsNullOrEmpty(value) ? [] :
            value.Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .ToList();
    }

    public async Task SetTrustedProxies(List<string> proxies)
    {
        var value = string.Join(",", proxies);
        var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.TrustedProxies);
        if (setting == null)
        {
            setting = new Setting { Key = SettingKeys.TrustedProxies, Value = value };
            dbContext.Settings.Add(setting);
        }
        else
        {
            setting.Value = value;
        }

        await dbContext.SaveChangesAsync();
        memoryCache.Set(SettingKeys.TrustedProxies, value, ExpirationRelativeToNow);
    }
    
    public async Task<(bool needsRegister, bool registerEnabled)> GetAuthStatus()
    {
        var userCount = await dbContext.Users.CountAsync();
        var registerEnabled = await IsRegisterEnabled();
        return (userCount == 0, registerEnabled);
    }
}