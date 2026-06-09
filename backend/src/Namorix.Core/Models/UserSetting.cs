using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class UserSetting
{
    public int Id { get; init; }
    public int UserId { get; init; }
    
    [MaxLength(100)] public string Key { get; init; } = string.Empty;
    [MaxLength(500)] public string Value { get; set; } = string.Empty;
    
    public User User { get; init; } = null!;
}