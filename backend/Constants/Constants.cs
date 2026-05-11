namespace backend.Constants;

public static class JwtClaims
{
    public const string UserId = "userId";
    public const string Username = "username";
    public const string Role = "role";
    public const string Jti = "jti";
    public const string Iat = "iat";
}

public static class AuthErrors
{
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string UsernameExists = "USERNAME_EXISTS";
    public const string TokenReuseDetected = "TOKEN_REUSE_DETECTED";
    public const string FingerprintMismatch = "FINGERPRINT_MISMATCH";
    public const string InvalidToken = "INVALID_TOKEN";
    public const string SingUpClosed = "SIGNUP_CLOSED";
}