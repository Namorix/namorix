namespace Namorix.Server.Constants;

public static class ServerSignalRGroups
{
    public const string SystemMonitor = "system-monitor";
    public const string Addon = "addon";
}

public static class ServerSignalREvent
{
    public const string SystemMonitorStatsUpdate = $"{ServerSignalRGroups.SystemMonitor}:stats-update";
    public const string AddonStatusChanged = $"{ServerSignalRGroups.Addon}:status-changed";

}