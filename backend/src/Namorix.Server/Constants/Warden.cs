using Namorix.Server.Models.Warden;

namespace Namorix.Server.Constants;

public static class WdErrorCodes
{
    public const string RuleNotFound = "WD_RULE_NOT_FOUND";
    public const string IpAlreadyBanned = "WD_IP_ALREADY_BANNED";   // Auto-deny already exists
    public const string InvalidCidr = "WD_INVALID_CIDR";            // Invalid SourceCidr format
    public const string InvalidPorts = "WD_INVALID_PORTS";          // Invalid "80,443" / "1-1024" format
    public const string EnforcementFailed = "WD_ENFORCEMENT_FAILED"; // iptables apply/remove failed (missing NET_ADMIN etc.)
}

public static class WdEventTypes
{
    public const string AcmeChallengeFail = "ACME_CHALLENGE_FAIL";
    public const string Scan404 = "SCAN_404";
    public const string BruteForce = "BRUTE_FORCE";
    public const string ExploitAttempt = "EXPLOIT_ATTEMPT";
    public const string AutoBan = "AUTO_BAN";
    public const string RuleApplied = "RULE_APPLIED";
    public const string RuleRemoved = "RULE_REMOVED";
    public const string BanExpired = "BAN_EXPIRED";
}

public static class WdEventAction
{
    public const string Applied = "applied";
    public const string Removed = "removed";
}

public static class WdThresholdFactors
{
    public static (double Threshold, double Duration) For(WdSecurityProfile profile, WdSettings settings) => profile switch
    {
        WdSecurityProfile.Low    => (2.0, 0.5),                 // lenient: threshold ×2, ban ×0.5
        WdSecurityProfile.High   => (0.5, 2.0),                 // strict: threshold ×0.5, ban ×2
        WdSecurityProfile.Custom => (settings.CustomThresholdFactor,
            settings.CustomDurationFactor),
        _ => (1.0, 1.0),                                        // Medium

    };
}
public static class WdThresholdRules
{
    public static (int Threshold, TimeSpan Lookback, TimeSpan? BanDuration) For(string eventType, double thresholdFactor, double durationFactor)
    {
        var (baseThreshold, lookback, baseDuration) = BaseFor(eventType);
        var threshold = Math.Max(1, (int)Math.Round(baseThreshold * thresholdFactor));
        var duration = baseDuration is not null
            ? (TimeSpan?)TimeSpan.FromSeconds(baseDuration.Value.TotalSeconds * durationFactor)
            : null;
        return (threshold, lookback, duration);
    }
    private static (int Threshold, TimeSpan Lookback, TimeSpan? BanDuration) BaseFor(string eventType) => eventType switch
    {
        WdEventTypes.AcmeChallengeFail => (20, TimeSpan.FromMinutes(5),   TimeSpan.FromHours(1)),
        WdEventTypes.Scan404          => (10, TimeSpan.FromHours(1),      TimeSpan.FromMinutes(30)),
        WdEventTypes.BruteForce       => (10, TimeSpan.FromMinutes(5),    TimeSpan.FromHours(1)),
        WdEventTypes.ExploitAttempt   => (3, TimeSpan.FromMinutes(5),     TimeSpan.FromDays(30)),
        _ => (int.MaxValue, TimeSpan.FromMinutes(5), null)
    };
}