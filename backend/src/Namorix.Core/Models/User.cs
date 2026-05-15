using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class User
{
    public int Id { get; init; }
    
    [MaxLength(100)]
    public string Username { get; init; } = string.Empty;
    
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
    
    public int Role { get; init; }
    
    [MaxLength(100)]
    public string ThemeId { get; init; } = string.Empty;
    
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }

    public ICollection<RefreshToken> RefreshTokens { get; init; } = new List<RefreshToken>();
    public ICollection<UserPermission> UserPermissions { get; init; } = new List<UserPermission>();
}