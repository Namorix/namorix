using backend.Constants;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SettingsService
{
    private readonly AppDbContext _dbContext;

    public SettingsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsSignUpEnabled()
    {
        var setting = await _dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.SignUpEnabled);
        if (setting == null)
        {
            return true;
        }

        return setting.Value.Equals(SettingValues.True, StringComparison.OrdinalIgnoreCase);
    }

    public async Task SetSignUpEnabled(bool enabled)
    {
        var setting = await _dbContext.Settings.FirstOrDefaultAsync(s => s.Key == SettingKeys.SignUpEnabled);
        if (setting == null)
        {
            setting = new Setting { Key = SettingKeys.SignUpEnabled, Value = enabled ? SettingValues.True : SettingValues.False };
            _dbContext.Settings.Add(setting);
        }
        else
        {
            setting.Value = enabled ? SettingValues.True : SettingValues.False;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<(bool needsSignUp, bool signUpEnabled)> GetAuthStatus()
    {
        var userCount = await _dbContext.Users.CountAsync();
        var signupEnabled = await IsSignUpEnabled();
        return (userCount == 0, signupEnabled);
    }
}