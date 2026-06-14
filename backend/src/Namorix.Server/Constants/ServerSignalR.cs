namespace Namorix.Server.Constants;

public static class ServerSignalRGroups
{
    public const string SystemMonitor = "system-monitor";
}

public static class ServerSignalREvent
{
    public const string SystemMonitorStatsUpdate = $"{ServerSignalRGroups.SystemMonitor}:stats-update";
}