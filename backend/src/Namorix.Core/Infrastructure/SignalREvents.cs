using Microsoft.Extensions.Logging;

namespace Namorix.Core.Infrastructure;

public record TrafficLogsFlushed(
    int TotalRequests,
    int ErrorCount,
    double AvgDurationMs,
    double AvgResponseSizeBytes
);

public record LogEntryRecord(
    LogLevel Level,
    string Source,
    string Message,
    DateTime Timestamp
);

public record ConfigChanged(string Key);
public record UserSettingsChanged(int UserId);