namespace Namorix.Core.Models;

public class UserPermission
{
    public int Id { get; init; }
    public int UserId { get; init; }
    public int PermissionId { get; init; }
    public DateTime GrantedAt { get; init; }
    
    public User? User { get; init; }
    public Permission? Permission { get; init; }
}