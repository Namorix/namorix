namespace Namorix.Server.Constants;

public static class NotificationKeys
{
    public static class Beacon
    {
        public const string BeaconHostnameError = "beacon:hostnameError";
        public const string BeaconHostnameRecovered = "beacon:hostnameRecovered";
    }
    
    public static class Warden
    {
        public const string RuleApplied = "warden:ruleApplied";
        public const string RuleRemoved = "warden:ruleRemoved";
    }
}
