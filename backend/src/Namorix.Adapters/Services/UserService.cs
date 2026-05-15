using Microsoft.EntityFrameworkCore;
using Namorix.Adapters.Persistence;

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
}