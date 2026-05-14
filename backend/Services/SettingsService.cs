using backend.Constants;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public class SettingsService(AppDbContext dbContext, IMemoryCache memoryCache)
{
    public async Task<bool> IsRegisterEnabled()
    {
        return await memoryCache.GetOrCreateAsync(SettingKeys.RegisterEnabled, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Time.ExpirationRelativeToNow;
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
        memoryCache.Set(SettingKeys.RegisterEnabled, enabled, Time.ExpirationRelativeToNow);
    }

    private async Task<List<string>> GetListAsync(string key)
    {
        var value = await memoryCache.GetOrCreateAsync(key, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Time.ExpirationRelativeToNow;
            return (await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == key))?.Value ?? "";
        });

        return string.IsNullOrEmpty(value)
            ? []
            : value.Split(",", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .ToList();
    }

    private async Task SetListAsync(string key, List<string> items)
    {
        var value = string.Join(",", items);
        var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
        {
            setting = new Setting { Key = key, Value = value };
            dbContext.Settings.Add(setting);
        }
        else
        {
            setting.Value = value;
        }

        await dbContext.SaveChangesAsync();
        memoryCache.Set(key, value, Time.ExpirationRelativeToNow);
    }

    public async Task<List<string>> GetTrustedProxies() =>
        await GetListAsync(SettingKeys.TrustedProxies);

    public async Task SetTrustedProxies(List<string> proxies) =>
        await SetListAsync(SettingKeys.TrustedProxies, proxies);

    public async Task<List<string>> GetAllowedOrigins() =>
        await GetListAsync(SettingKeys.AllowedOrigins);

    public async Task SetAllowedOrigins(List<string> origins) =>
        await SetListAsync(SettingKeys.AllowedOrigins, origins);
    
    public async Task<(bool needsRegister, bool registerEnabled)> GetAuthStatus()
    {
        var userCount = await dbContext.Users.CountAsync();
        var registerEnabled = await IsRegisterEnabled();
        return (userCount == 0, registerEnabled);
    }
}