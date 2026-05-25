using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Namorix.Adapters.Persistence;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;

namespace Namorix.Adapters.Services;

public class UserService(AppDbContext appDbContext, ILogger<UserService> logger)
{
    public async Task<string?> GetThemeAsync(int userId)
    {
        return await appDbContext.Users
            .Where(u => u.Id == userId)
            .Select(u => u.ThemeId)
            .FirstOrDefaultAsync();
    }

    public async Task SetThemeAsync(int userId, string themeId)
    {
        logger.LogInformation("Theme changed: userId={UserId}, themeId={ThemeId}", userId, themeId);
        await appDbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.ThemeId, themeId));
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