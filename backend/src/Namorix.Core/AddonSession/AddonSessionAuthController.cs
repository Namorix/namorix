using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Namorix.Core.Constants;
using Namorix.Core.OAuth;

namespace Namorix.Core.AddonSession;

[ApiController]
[Route("api/oauth")]
public sealed class AddonSessionAuthController(
    IAddonSessionService sessions,
    AddonSessionAuthService oauth,
    IOptions<AddonSessionAuthOptions> options) : ControllerBase
{
    [HttpGet("login")]
    public async Task<IActionResult> Login(CancellationToken ct)
        => Redirect(await oauth.BuildLoginUrlAsync(Request, ct));

    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string code, [FromQuery] string state, CancellationToken ct)
    {
        AddonSession session;
        try
        {
            session = await oauth.CompleteLoginAsync(code, state, ct);
        }
        catch (OAuthCallbackException ex)
        {
            return BadRequest(new OAuthErrorResponse(ex.ErrorCode, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidRequest, ex.Message));
        }

        var opts = options.Value;
        Response.Cookies.Append(opts.CookieName, session.Id, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(opts.SessionTtlDays),
        });
        return Redirect(opts.RedirectPath);
    }

    [HttpGet("status")]
    public IActionResult Status()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId is null
            ? Unauthorized(new { authenticated = false })
            : Ok(new { authenticated = true, userId = int.Parse(userId) });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var opts = options.Value;
        if (!Request.Cookies.TryGetValue(opts.CookieName, out var sessionId))
            return NoContent();
        
        await sessions.DeleteAsync(sessionId, ct);
        Response.Cookies.Delete(opts.CookieName, new CookieOptions { Path = "/" });
        return NoContent();
    }
}
