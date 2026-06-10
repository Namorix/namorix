namespace Namorix.Core.Constants;

public static class SignalRPath
{
    public const string HubPrefix = "/hubs";
    public const string HubMain = "/hubs/main";
}

public static class SignalRGroups
{
    public const string Traffic = "traffic";
    public const string Logs = "logs";
}
public static class SignalREvents
{
    public const string TrafficNewLogs = "traffic:new-logs";
    public const string TrafficStatsInit = "traffic:stats-init";
    public const string LogsNewEntry = "logs:new-entry";
    public const string LogsHistory = "logs:history";
    public const string SystemConfigChanged = "system:config-changed";
    public const string UserSettingsChanged = "user:settings-changed";
    public const string NotificationReceived = "notification:received";
    public const string NotificationReadStatus = "notification:read-status";
}