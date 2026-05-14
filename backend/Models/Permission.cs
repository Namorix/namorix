using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Permission
{
    public int Id { get; init; }

    [MaxLength(100)]
    public string Name { get; init; } = string.Empty;
    
    public int Value { get; init; }
    
    [MaxLength(250)]
    public string? Description { get; init; }

    public ICollection<UserPermission> UserPermissions { get; init; } = new List<UserPermission>();
}