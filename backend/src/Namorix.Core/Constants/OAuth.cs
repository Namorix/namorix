namespace Namorix.Core.Constants;

public static class OAuth
{
    public static class NmxOAuth2Env
    {
        public const string ApiUrl = "NMX_API_URL";
        public const string RegistrationToken = "NMX_REGISTRATION_TOKEN";
        public const string DataDir = "NMX_DATA_DIR";
    }
    
    public static class NmxOAuth2Defaults
    {
        public const string Bearer = "Bearer";
        public const string JwtBearerAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
    }
    
    public static class GrantTypes
    {
        public const string AuthorizationCode = "authorization_code";
        public const string ClientCredentials = "client_credentials";
    }
    
    public static class OAuthParameter
    {
        public const string GrantType = "grant_type";
        public const string Code = "code";
        public const string ClientId = "client_id";
        public const string ClientAssertionType = "client_assertion_type";
        public const string ClientAssertion = "client_assertion";
    }
}