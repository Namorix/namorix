namespace Namorix.Server.Constants;

public static class ServerSignalRGroups
{
    public const string SystemMonitor = "system-monitor";
    public const string Addon = "addon";
    public const string Beacon = "beacon";
    public const string Frontgate = "frontgate";
    public const string Warden = "warden"; 
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
    public const string BeaconHostnameChanged = $"{ServerSignalRGroups.Beacon}:hostname-changed";
    public const string FrontgateCertStatusChanged = $"{ServerSignalRGroups.Frontgate}:cert-status-changed";
    public const string FrontgateRuleChanged = $"{ServerSignalRGroups.Frontgate}:rule-changed";
    public const string FrontgateDryRunChanged = $"{ServerSignalRGroups.Frontgate}:dry-run-changed";
    public const string FrontgateCertChanged = $"{ServerSignalRGroups.Frontgate}:cert-changed";
    public const string FrontgateAuditCreated = $"{ServerSignalRGroups.Frontgate}:audit-created";
    public const string WardenNewEvent = $"{ServerSignalRGroups.Warden}:new-event";
}