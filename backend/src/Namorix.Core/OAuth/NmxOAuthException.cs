using System.Net;

namespace Namorix.Core.OAuth;

public class NmxOAuthException(
    string action, HttpStatusCode statusCode, string? error, string? errorDescription)
    : Exception($"{action} failed ({(int)statusCode}): {error} - {errorDescription}")
{
    public string? Error { get; } = error;
    public string? ErrorDescription { get; } = errorDescription;
}