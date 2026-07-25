using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Extensions;
using Namorix.Core.OAuth;
using Namorix.Core.Responses;
using Namorix.Server.Config;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/oauth")]
public class OAuthController(OAuthService oauth, AddonChannelManager channelManager,
    IOptions<AppConfig> appConfig, IOptions<FrontendConfig> frontendConfig) : ControllerBase
{
    private readonly AppConfig _appConfig = appConfig.Value;
    
    [HttpGet("authorize")]
    public async Task<IActionResult> Authorize([FromQuery] AuthorizeRequest request)
    {
        var userIdClaim = User.FindFirst(JwtClaims.UserId)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
        {
            var returnUrl = $"{OAuthEndpoints.Authorize}?{Request.QueryString.Value?.TrimStart('?')}";
            return Redirect($"{frontendConfig.Value.BaseUrl}/login?returnUrl={Uri.EscapeDataString(returnUrl!)}");
        }

        var addonId = await oauth.ValidateAuthorizationAsync(request.ClientId, request.RedirectUri);
        if (addonId is null)
        {
            return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidClient,
                "Invalid client_id"));
        }
        
        var code = await oauth.CreateAuthorizationCodeAsync(
            request.ClientId, userId, request.Scope, request.RedirectUri,
            request.CodeChallenge, request.CodeChallengeMethod);
        
        var redirectUrl = $"{request.RedirectUri}?code={code.Code}";

        if (!string.IsNullOrEmpty(request.State))
            redirectUrl += $"&state={request.State}";
        
        return Redirect(redirectUrl);
    }

    [HttpPost("token")]
    [Consumes("application/x-www-form-urlencoded")]
    public async Task<IActionResult> Token([FromForm] TokenRequest request)
    {
        switch (request.GrantType)
        {
            case OAuth.GrantTypes.AuthorizationCode:
            {
                var (tokenId, refreshToken) = await oauth.ExchangeCodeAsync(request.Code, request.ClientId,
                    request.ClientAssertion, request.CodeVerifier);
            
                if (tokenId is null)
                {
                    return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidGrant,
                        "Authorization code is invalid or expired"));
                }
                
                SetAddonRefreshTokenCookie(refreshToken);
                return Ok(new OAuthTokenResponse(tokenId, 3600, OAuth.NmxOAuth2Defaults.Bearer));
            }
        
            case OAuth.GrantTypes.ClientCredentials:
            {
                if (string.IsNullOrEmpty(request.ClientAssertion))
                {
                    return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidClient,
                        "client_assertion is required"));
                }
                if (request.ClientAssertionType != OAuth.NmxOAuth2Defaults.JwtBearerAssertionType)
                {
                    return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidClient,
                        "Unsupported client_assertion_type"));
                }
            
                var tokenId = await oauth.IssueClientCredentialsTokenAsync(request.ClientAssertion);
                if (tokenId is null)
                {
                    return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidClient,
                        "Client assertion is invalid or expired"));
                }
                return Ok(new OAuthTokenResponse(tokenId, 3600, OAuth.NmxOAuth2Defaults.Bearer));
            }
        
            default:
                return BadRequest(new OAuthErrorResponse(OAuthErrors.UnsupportedGrantType,
                    $"Grant type '{request.GrantType}' is not supported"));
        }
    }
    
    
    [HttpPost("token/refresh")]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies[CookieName.AddonRefreshToken];
        if (refreshToken is null)
            return Unauthorized();
        
        var result = await oauth.RefreshAddonTokenAsync(refreshToken);
        if (result is null)
            return Unauthorized();
        
        if (result.Value.Status == OAuthRefreshStatus.Reused)
        {
            Response.DeleteCookie(CookieName.AddonRefreshToken);
            return Unauthorized(ApiResponse.Fail(OAuthRefreshErrors.TokenReused,
                "Refresh token was reused. Possible theft detected. Re-registration required."));
        }
        
        var (tokenId, newRefreshToken, _) = result.Value;
        SetAddonRefreshTokenCookie(newRefreshToken!);
        
        return Ok(new OAuthTokenResponse(tokenId!, 3600, OAuth.NmxOAuth2Defaults.Bearer));
    }
    
    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromBody] RevokeRequest request)
    {
        var addonId = await oauth.RevokeTokenAsync(request.Token, request.TokenTypeHint);
        if (addonId != null)
            channelManager.DisconnectAsync(addonId);
        
        return Ok(new { }); // OAuth2 spec: always 200
    }
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterClientRequest request)
    {
        var clientId = await oauth.RegisterClientAsync(request.RegistrationToken, request.PublicKey);
        if (clientId is null)
        {
            return Unauthorized(ApiResponse.Fail(OAuthRegisterErrors.InvalidToken));
        }
        
        return Ok(new { clientId });
    }

    private void SetAddonRefreshTokenCookie(string token) =>
        Response.SetCookie(CookieName.AddonRefreshToken, token,
            DateTimeOffset.UtcNow.AddDays(_appConfig.OAuthRefreshTokenTtlDays).DateTime, _appConfig.SecureCookie);
}

public class AuthorizeRequest
{
    [FromQuery(Name = "client_id")]
    public string ClientId { get; init; } = string.Empty;
    
    [FromQuery(Name = "redirect_uri")]
    public string RedirectUri { get; init; } = string.Empty;
    
    [FromQuery(Name = "response_type")]
    public string ResponseType { get; init; } = string.Empty;
    
    [FromQuery(Name = "code_challenge")]
    public string? CodeChallenge { get; init; }
    
    [FromQuery(Name = "code_challenge_method")]
    public string? CodeChallengeMethod { get; init; }
    
    [FromQuery(Name = "scope")]
    public string? Scope { get; init; }
    
    [FromQuery(Name = "state")]
    public string? State { get; init; }
}

public class TokenRequest
{
    [FromForm(Name = OAuth.OAuthParameter.GrantType)]
    public string GrantType { get; init; } = string.Empty;
    
    [FromForm(Name = OAuth.OAuthParameter.Code)]
    public string Code { get; init; } = string.Empty;
    
    [FromForm(Name = OAuth.OAuthParameter.CodeVerifier)]
    public string? CodeVerifier { get; init; }

    [FromForm(Name = OAuth.OAuthParameter.ClientId)]
    public string ClientId { get; init; } = string.Empty;
    
    [FromForm(Name = OAuth.OAuthParameter.ClientAssertion)]
    public string ClientAssertion { get; init; } = string.Empty;
    
    [FromForm(Name = OAuth.OAuthParameter.ClientAssertionType)]
    public string ClientAssertionType { get; init; } = string.Empty;
}

public record RegisterClientRequest(string RegistrationToken, string PublicKey);
public record RevokeRequest(string Token, string? TokenTypeHint);