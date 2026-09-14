namespace Namorix.Core.Constants;

public static class OAuth
{
    public const string WellKnownPath = "/.well-known/nmx-oauth-config";
    
    public static class NmxOAuth2Env
    {
        public const string DesktopApiUrl = "NMX_DESKTOP_API_URL";
        public const string DesktopGrpcUrl = "NMX_DESKTOP_GRPC_URL";
        public const string RegistrationToken = "NMX_REGISTRATION_TOKEN";
        public const string DataDir = "NMX_DATA_DIR";
    }
    
    public static class NmxOAuth2Defaults
    {
        public const string Bearer = "Bearer";
        public const string Authorization = "Authorization";
        public const string JwtBearerAssertionType = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
        public const string DataDir = "./data" ;
    }
    
    public static class Trailer
    {
        public const string ErrorCode = "nmx-error-code";
    }

    // Shared with the addon verifier, so these live in the SDK and not on the desktop side.
    public static class AddonToken
    {
        public const string Issuer = "namorix-desktop";
        public const string SessionIdClaim = "session_id";
        public const string ClientIdClaim = "client_id";

        // Single source of truth for the addon access token lifetime (DG7). The JWT
        // `exp` and every `expires_in` handed to the addon must agree: if the token
        // dies at 900s while expires_in still says 3600, the addon waits 45 more
        // minutes before refreshing and every request in that gap fails.
        // Not used for the client_credentials machine token, whose TTL is separate.
        public const int AccessTokenTtlSeconds = 900;
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
        public const string CodeVerifier = "code_verifier";
        public const string ClientId = "client_id";
        public const string ClientAssertionType = "client_assertion_type";
        public const string ClientAssertion = "client_assertion";
    }
}