namespace Namorix.Core.Infrastructure;

public record TrafficLogsFlushed(
    int TotalRequests,
    int ErrorCount,
    double AvgDurationMs,
    double AvgResponseSizeBytes
);

public record ConfigChanged(string Key);
public record ThemeChanged(string ThemeId);