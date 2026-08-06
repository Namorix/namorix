using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models;

public class BcnSettings
{
    [Key] public int Id { get; init; } = 1;  // Always = 1

    public int CheckIntervalMinutes { get; set; } = 15;

    public int HeartbeatIntervalHours { get; set; } = 1;

    [MaxLength(20)] public string IpDetectionService { get; set; } = "auto";

    public bool UpdateIpv6 { get; set; }
}