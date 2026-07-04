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
    public const string AddonPendingTaskChanged = $"{ServerSignalRGroups.Addon}:pending-task-changed";
    public const string AddonUninstalled = $"{ServerSignalRGroups.Addon}:uninstalled";
    public const string AddonWidgetEvent = $"{ServerSignalRGroups.Addon}:widget-event";
}