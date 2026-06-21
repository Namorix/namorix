using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class UserService(AppDbContext appDbContext, ILogger<UserService> logger)
{
    public async Task UpdateProfileAsync(int userId, string email, string name)
    {
        var emailExists = await appDbContext.Users
            .AnyAsync(u => u.Email == email && u.Id != userId);
        
        if (emailExists)
            throw new AuthException(AuthErrors.EmailExists);
        
        var nameExists = await appDbContext.Users
            .AnyAsync(u => u.Name == name && u.Id != userId);
        
        if (nameExists)
            throw new AuthException(AuthErrors.NameExists);
        
        await appDbContext.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Email, email)
                .SetProperty(u => u.Name, name));
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