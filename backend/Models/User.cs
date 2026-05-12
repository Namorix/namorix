using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class User
{
    public int Id { get; init; }
    
    [MaxLength(100)]
    public string Username { get; init; } = string.Empty;
    
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
    
    public int Role { get; init; }
    public DateTime CreateAt { get; init; }
    public DateTime? UpdateAt { get; init; }

    public ICollection<RefreshToken> RefreshTokens { get; init; } = new List<RefreshToken>();
}