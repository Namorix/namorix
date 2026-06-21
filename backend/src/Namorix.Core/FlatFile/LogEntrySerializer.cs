using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;

namespace Namorix.Core.FlatFile;

public class LogEntrySerializer : IFlatFileSerializer<LogEntrySerializer>
{
    [JsonIgnore]
    public LogLevel Level { get; init; }

    [JsonPropertyName("level")]
    public int LevelValue => (int)Level;
    
    public string Source { get; init; } = "";
    public string Message { get; init; } = "";
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;

    [JsonIgnore]
    public string LogGroup { get; init; } = "";

    public int Group => LogGroup switch
    {
        LogGroups.Core => 0,
        LogGroups.App => 1,
        LogGroups.Controller => 2,
        LogGroups.Auth => 3,
        LogGroups.Database => 4,
        _ => 5,
    };
    
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
            LogGroup = MapSourceToGroup(parts[2]),
            Message = parts[3],
        };
    }
    
    public static string MapSourceToGroup(string source)
    {
        if (source.StartsWith("Namorix.Core.Workers") || source.StartsWith("Namorix.Core.")) return LogGroups.Core;
        if (source.StartsWith("Namorix.Server.Controllers")) return LogGroups.Controller;
        if (source.StartsWith("Namorix.Server.Services.AuthService") ||
            source.StartsWith("Namorix.Server.Controllers.Auth")) return LogGroups.Auth;
        if (source.StartsWith("Microsoft.EntityFrameworkCore")) return LogGroups.Database;
        if (source.StartsWith("Namorix.Workers") || source.StartsWith("Namorix.Server") ||
            source == "Microsoft.Hosting.Lifetime") return LogGroups.App;
        return LogGroups.Misc;
    }

    public static string Category => "logs";
    public static string Separator => " | ";
    public static DateTime GetTimestamp(LogEntrySerializer entry) => entry.Timestamp;
}