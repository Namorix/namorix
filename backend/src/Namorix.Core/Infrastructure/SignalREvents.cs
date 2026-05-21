namespace Namorix.Core.Infrastructure;

public record TrafficLogsFlushed(int Count);
public record ConfigChanged(string Key);
public record ThemeChanged(string ThemeId);