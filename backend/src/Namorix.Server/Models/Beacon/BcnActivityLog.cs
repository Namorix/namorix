using System.ComponentModel.DataAnnotations;

namespace Namorix.Server.Models;

public enum BcnLogLevel { Info, Success, Warn, Error }

public class BcnActivityLog
{
    [Key] public int Id { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public BcnLogLevel Level { get; init; } = BcnLogLevel.Info;

    [MaxLength(64)] public string? Code { get; init; }
    public string? ParamsJson { get; init; } 
    
    [MaxLength(32)] public string? HostnameId { get; init; }
    public BcnHostname? Hostname { get; init; }
}