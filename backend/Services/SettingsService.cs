using backend.Constants;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SettingsService(AppDbContext dbContext)
{
    public async Task<bool> IsRegisterEnabled()
    {
        var setting = await dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.RegisterEnabled);
        return setting?.Value.Equals(SettingValues.True, StringComparison.OrdinalIgnoreCase) ?? true;
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
    }

    public async Task<(bool needsRegister, bool registerEnabled)> GetAuthStatus()
    {
        var userCount = await dbContext.Users.CountAsync();
        var registerEnabled = await IsRegisterEnabled();
        return (userCount == 0, registerEnabled);
    }
}