using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models.Warden;

public enum WdSecurityProfile { Low, Medium, High, Custom }

public class WdSettings
{
    [Key] public int Id { get; init; }   // single-row settings, seed Id = 1

    public bool FirewallEnabled { get; set; } = true;
    public WdSecurityProfile Profile { get; set; } = WdSecurityProfile.Medium;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}