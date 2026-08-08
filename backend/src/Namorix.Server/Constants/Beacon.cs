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
    public const string DuplicateHost = "BCN_DUPLICATE_HOST";
    public const string ConfigInvalid = "BCN_CONFIG_INVALID";
}

public static class BcnActivityCodes
{
    public const string Updated = "BCN_UPDATED";
    public const string Probed = "BCN_PROBED";
}

public static class BcnHttpClientNames
{
    public const string Get = "BcnGet";
    public const string Rest = "BcnRest";
}

public static class BcnAuthScheme
{
    public const string Basic = "basic";
}

public static class BcnHeaderKey{
    public const string Bearer = "Bearer";
    public const string Basic = "Basic";
    public const string SsoKey = "sso-key";
}

public static class BcnParam
{
    public const string Field = "field";
    public const string FieldConfig = "config";
    public const string FieldHost = "host";
    public const string FieldUrlTemplate = "urlTemplate";
    public const string FieldUser = "user";
    public const string FieldEndpointTemplate = "endpointTemplate";
    public const string FieldRecordLookupTemplate = "recordLookupTemplate";
    
    public const string Detail = "detail";
    public const string HttpStatus = "httpStatus";
    public const string Reason = "reason";
    public const string Hostname = "hostname";
    public const string Provider = "provider";
    public const string Ip = "ip";
    public const string Ipv6 = "ipv6";
    public const string RetryAt = "retryAt";
    public const string Zone = "zone";
    public const string Type = "type";
}

public static class BcnCredentialParam
{
    public const string Username = "username";
    public const string Password = "password";
    public const string Token = "token";
    public const string ApiToken = "apiToken";
    public const string ApiKey = "apiKey";
    public const string ApiSecret = "apiSecret";
    public const string Zone = "zone";
}

public enum BcnHostnameAction { Created, Updated, Deleted }
