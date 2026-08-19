namespace Namorix.Core.AddonSession;

public sealed class OAuthCallbackException(
    string errorCode, string message, Exception? innerException = null)
    : Exception(message, innerException)
{
    public string ErrorCode { get; } = errorCode;
}
