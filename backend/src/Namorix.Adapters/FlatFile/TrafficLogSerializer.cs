using Namorix.Core.FlatFile;

namespace Namorix.Adapters.FlatFile;

public class TrafficLogSerializer : IFlatFileSerializer<TrafficLogSerializer>
{
    public long Id { get; init; }
    public string? Method { get; init; }
    public string? Path { get; init; }
    public int StatusCode { get; init; }
    public long DurationMs { get; init; }
    public long ResponseSizeBytes { get; init; }
    public string? Ip { get; init; }
    public int? UserId { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public static string Serialize(TrafficLogSerializer entry)
    {
        var ip = entry.Ip ?? "-";
        var uid = entry.UserId?.ToString() ?? "";
        return
            $"{entry.Timestamp:yyyy-MM-ddTHH:mm:ssZ} {entry.Method ?? "-"} " +
            $"{entry.Path ?? "-"} {entry.StatusCode} {entry.DurationMs}ms " +
            $"{entry.ResponseSizeBytes}B {ip}{(uid.Length > 0 ? $" {uid}" : "")}";
    }

    public static TrafficLogSerializer? Deserialize(string line, string category)
    {
        var parts = line.Split(' ', 8);
        if (parts.Length < 7)
            return null;

        if (!DateTime.TryParseExact(parts[0], "yyyy-MM-ddTHH:mm:ssZ", null,
                System.Globalization.DateTimeStyles.AssumeUniversal, out var ts))
        {
            return null;
        }
        
        var method = parts[1];
        var path = parts[2];
        
        if (!int.TryParse(parts[3], out var status)) return null;
        if (!long.TryParse(parts[4].TrimEnd('m','s'), out var dur)) return null;
        if (!long.TryParse(parts[5].TrimEnd('B'), out var size)) return null;
        
        var ip = parts[6] == "-" ? null : parts[6];
        int? uid = parts.Length > 7 && int.TryParse(parts[7], out var u) ? u : null;

        return new TrafficLogSerializer
        {
            Timestamp = ts,
            StatusCode = status,
            DurationMs = dur,
            ResponseSizeBytes = size,
            UserId = uid,
            Method = method == "-" ? null : method,
            Path = path == "-" ? null : path,
            Ip = ip,
        };
    }

    public static string Category => "traffic";
    public static string Separator => " ";
    public static DateTime GetTimestamp(TrafficLogSerializer entry) => entry.Timestamp;
}