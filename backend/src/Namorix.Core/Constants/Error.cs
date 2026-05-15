namespace Namorix.Core.Constants;

public static class AuthErrors
{
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string UsernameExists = "USERNAME_EXISTS";
    public const string TokenReuseDetected = "TOKEN_REUSE_DETECTED";
    public const string FingerprintMismatch = "FINGERPRINT_MISMATCH";
    public const string InvalidToken = "INVALID_TOKEN";
    public const string RegisterClosed = "REGISTER_CLOSED";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
}

public static class ValidationErrorCodes
{
    public const string Required = "REQUIRED";
    public const string TooShort = "TOO_SHORT";
    public const string TooLong = "TOO_LONG";
    public const string Mismatch = "MISMATCH";
    public const string InvalidFormat = "INVALID_FORMAT";
    public const string InvalidType = "INVALID_TYPE";
    public const string OutOfRange = "OUT_OF_RANGE";
    public const string InvalidEnum = "INVALID_ENUM";
    public const string ValidationError = "VALIDATION_ERROR";
}

public static class HttpErrorCodes
{
    public const string NotFound = "NOT_FOUND";
    public const string InternalError = "INTERNAL_ERROR";
    public const string BadRequest = "BAD_REQUEST";
}

public static class MiddlewareErrorCodes
{
    public const string CsrfTokenMismatch = "CSRF_TOKEN_MISMATCH";
    public const string UnsupportedMediaType = "UNSUPPORTED_MEDIA_TYPE";
    public const string InvalidRequestBody = "INVALID_REQUEST_BODY";
    public const string RateLimitExceeded = "RATE_LIMIT_EXCEEDED";
    public const string UntrustedProxy = "UNTRUSTED_PROXY";
}