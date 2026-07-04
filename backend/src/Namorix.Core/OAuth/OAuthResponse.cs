namespace Namorix.Core.OAuth;

public record OAuthTokenResponse(string AccessToken, int ExpiresIn, string TokenType);
public record OAuthErrorResponse(string Error, string? ErrorDescription = null);