using Microsoft.Extensions.Logging;

namespace Namorix.Core.FlatFile;

public class LogEntrySerializer : IFlatFileSerializer<LogEntrySerializer>
{
    public LogLevel Level { get; init; }
    public string Source { get; init; } = "";
    public string Message { get; init; } = "";
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    public static string Serialize(LogEntrySerializer entry)
    {
        var level = entry.Level switch
        {
            LogLevel.Trace       => "trace",
            LogLevel.Debug       => "debug",
            LogLevel.Information  => "info",
            LogLevel.Warning     => "warn",
            LogLevel.Error       => "error",
            LogLevel.Critical    => "fatal",
            _                    => "info",
        };
        return $"{entry.Timestamp:O} | {level} | {entry.Source} | {entry.Message}";
    }

    public static LogEntrySerializer? Deserialize(string line, string category)
    {
        var parts = line.Split(" | ", 4);
        if (parts.Length < 4) return null;

        if (!DateTime.TryParse(parts[0], null,
                System.Globalization.DateTimeStyles.RoundtripKind, out var ts))
            return null;

        var level = parts[1] switch
        {
            "trace" => LogLevel.Trace,
            "debug" => LogLevel.Debug,
            "info"  => LogLevel.Information,
            "warn"  => LogLevel.Warning,
            "error" => LogLevel.Error,
            "fatal" => LogLevel.Critical,
            _       => LogLevel.None,
        };

        return new LogEntrySerializer
        {
            Timestamp = ts,
            Level = level,
            Source = parts[2],
            Message = parts[3],
        };
    }

    public static string Category => "logs";
    public static string Separator => " | ";
    public static DateTime GetTimestamp(LogEntrySerializer entry) => entry.Timestamp;
}