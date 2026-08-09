namespace Namorix.Server.Constants;

public static class WdErrorCodes
{
    public const string RuleNotFound = "WD_RULE_NOT_FOUND";
    public const string IpAlreadyBanned = "WD_IP_ALREADY_BANNED";   // Auto-deny already exists
    public const string InvalidCidr = "WD_INVALID_CIDR";            // Invalid SourceCidr format
    public const string InvalidPorts = "WD_INVALID_PORTS";          // Invalid "80,443" / "1-1024" format
}

public static class WdEventTypes
{
    public const string AcmeChallengeFail = "ACME_CHALLENGE_FAIL";
    public const string Scan404 = "SCAN_404";
    public const string BruteForce = "BRUTE_FORCE";
    public const string ExploitAttempt = "EXPLOIT_ATTEMPT";
}