namespace Namorix.Core.Constants;

public static class ExemptPaths
{
    // Machine clients sending form-urlencoded bodies — skip JSON enforcement.
    public static readonly string[] NonJsonBody = [
        "/api/oauth/token"
    ];

    // Machine clients with no cookie session — skip CSRF check.
    public static readonly string[] NoCsrfSession = [
        "/api/oauth/token",
        "/api/oauth/register"
    ];
}