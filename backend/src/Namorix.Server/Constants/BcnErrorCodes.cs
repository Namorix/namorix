namespace Namorix.Server.Constants;

public static class BcnErrorCodes
{
    public const string NoIp = "BCN_NO_IP";
    public const string InvalidCredentials = "BCN_INVALID_CREDENTIALS";
    public const string HostnameNotFound = "BCN_HOSTNAME_NOT_FOUND";
    public const string ZoneNotFound = "BCN_ZONE_NOT_FOUND";
    public const string AccountBlocked = "BCN_ACCOUNT_BLOCKED";
    public const string Unavailable = "BCN_UNAVAILABLE";
    public const string RateLimited = "BCN_RATE_LIMITED";
    public const string ProviderError = "BCN_PROVIDER_ERROR";
    public const string DuplicateHostname = "BCN_DUPLICATE_HOSTNAME";
    public const string ConfigInvalid = "BCN_CONFIG_INVALID";
}

public static class BcnActivityCodes
{
    public const string Updated = "BCN_UPDATED";
}