using System.ComponentModel.DataAnnotations;

namespace Namorix.Core.Models;

public class TrafficAddress
{
    public long Id { get; init; }

    [MaxLength(50)]
    public string Ip { get; init; } = string.Empty;

    public ICollection<TrafficLog> TrafficLogs { get; init; } = new List<TrafficLog>();
}