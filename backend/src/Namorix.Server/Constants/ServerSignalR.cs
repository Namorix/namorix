namespace Namorix.Server.Constants;

public static class ServerSignalRGroups
{
    public const string SystemMonitor = "system-monitor";
    public const string Addon = "addon";
    public const string Beacon = "beacon";
    public const string Frontgate = "frontgate";
}

public static class ServerSignalREvent
{
    public const string SystemMonitorStatsUpdate = $"{ServerSignalRGroups.SystemMonitor}:stats-update";
    public const string AddonStatusChanged = $"{ServerSignalRGroups.Addon}:status-changed";
    public const string AddonPendingTaskChanged = $"{ServerSignalRGroups.Addon}:pending-task-changed";
    public const string AddonUninstalled = $"{ServerSignalRGroups.Addon}:uninstalled";
    public const string AddonWidgetEvent = $"{ServerSignalRGroups.Addon}:widget-event";
    public const string BeaconHostnameStatusChanged = $"{ServerSignalRGroups.Beacon}:hostname-status-changed";
    public const string BeaconActivityCreated = $"{ServerSignalRGroups.Beacon}:activity-created";
    public const string BeaconHostnamesRefreshed = $"{ServerSignalRGroups.Beacon}:hostnames-refreshed";
    public const string FrontgateCertStatusChanged = $"{ServerSignalRGroups.Frontgate}:cert-status-changed";
}