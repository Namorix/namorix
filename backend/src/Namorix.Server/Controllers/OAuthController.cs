using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Constants;
using Namorix.Core.OAuth;
using Namorix.Core.Responses;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/oauth")]
public class OAuthController(OAuthService oauth, AddonChannelManager channelManager) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> Authorize(
        [FromQuery] string clientId,
        [FromQuery] string? codeChallenge,
        [FromQuery] string? codeChallengeMethod,
        [FromQuery] string redirectUri,
        [FromQuery] string responseType,
        [FromQuery] string? scope,
        [FromQuery] string? state)
    {
        var userIdClaim = User.FindFirst(JwtClaims.UserId)?.Value;
        if (userIdClaim is null || !int.TryParse(userIdClaim, out var userId))
        {
            var returnUrl = Url.Action(nameof(Authorize), "OAuth",
                new { clientId, redirectUri, responseType, scope, state,
                    codeChallenge, codeChallengeMethod });

            return Redirect($"/login?returnUrl={Uri.EscapeDataString(returnUrl!)}");
        }

        var addonId = await oauth.ValidateAuthorizationAsync(clientId, redirectUri);
        if (addonId is null)
        {
            return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidClient,
                "Invalid client_id or redirect_uri"));
        }
        
        var code = await oauth.CreateAuthorizationCodeAsync(
            clientId, userId, scope, redirectUri,
            codeChallenge, codeChallengeMethod);
        
        var redirectUrl = $"{redirectUri}?code={code.Code}";

        if (!string.IsNullOrEmpty(state))
            redirectUrl += $"&state={state}";
        
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
                var tokenId = await oauth.ExchangeCodeAsync(request.Code, request.ClientId,
                    request.ClientAssertion, request.CodeVerifier);
            
                if (tokenId is null)
                {
                    return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidGrant,
                        "Authorization code is invalid or expired"));
                }
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