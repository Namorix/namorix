using Microsoft.AspNetCore.Mvc;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/oauth")]
public class OAuthController(OAuthService oauth) : ControllerBase
{
    [HttpGet("authorize")]
    public async Task<IActionResult> Authorize(
        [FromQuery] string clientId,
        [FromQuery] string redirectUri,
        [FromQuery] string responseType,
        [FromQuery] string? scope,
        [FromQuery] string? state)
    {
        // TODO: Check user authentication, show consent screen
        // For now, auto-approve and return code
        var code = await oauth.CreateAuthorizationCodeAsync(
            clientId, userId: 1, scope, redirectUri);

        var redirectUrl = $"{redirectUri}?code={code.Code}";
        if (!string.IsNullOrEmpty(state))
            redirectUrl += $"&state={state}";

        return Redirect(redirectUrl);
    }

    [HttpPost("token")]
    public async Task<IActionResult> Token([FromForm] TokenRequest request)
    {
        if (request.GrantType != "authorization_code")
            return BadRequest(new { error = "unsupported_grant_type" });

        var tokenId = await oauth.ExchangeCodeAsync(
            request.Code, request.ClientId, request.ClientAssertion);

        if (tokenId is null)
            return BadRequest(new { error = "invalid_grant" });

        return Ok(new
        {
            access_token = tokenId,
            token_type = "bearer",
            expires_in = 3600,
        });
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke([FromForm] string token)
    {
        await oauth.RevokeTokenAsync(token);
        return Ok();
    }
}

public class TokenRequest
{
    public string GrantType { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string ClientId { get; init; } = string.Empty;
    public string ClientAssertion { get; init; } = string.Empty;
}