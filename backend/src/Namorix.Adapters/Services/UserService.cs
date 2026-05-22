using Microsoft.EntityFrameworkCore;
using Namorix.Adapters.Persistence;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;

namespace Namorix.Adapters.Services;

public class UserService(AppDbContext appDbContext)
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
            throw new AuthException(AuthErrors.IncorrectPassword);
        }

        await appDbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s =>
                s.SetProperty(u => u.Password, BCrypt.Net.BCrypt.HashPassword(newPassword)));
    }
}