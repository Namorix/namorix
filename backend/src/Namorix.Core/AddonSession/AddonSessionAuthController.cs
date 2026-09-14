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
    IAddonTokenStore tokens,
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
        AddonLoginResult result;
        try
        {
            result = await oauth.CompleteLoginAsync(code, state, ct);
        }
        catch (OAuthCallbackException ex)
        {
            // access_denied is the one refusal that is not about the request being wrong: the
            // addon is already granted to another user (DG9), so the request is understood and
            // refused. Everything else here is a malformed or expired call.
            var status = ex.ErrorCode == OAuthErrors.AccessDenied
                ? StatusCodes.Status403Forbidden
                : StatusCodes.Status400BadRequest;
            return StatusCode(status, new OAuthErrorResponse(ex.ErrorCode, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new OAuthErrorResponse(OAuthErrors.InvalidRequest, ex.Message));
        }

        var opts = options.Value;

        // The cookie carries the access JWT itself. Its MaxAge follows the refresh token,
        // not the JWT's own 900s: the middleware needs the cookie to survive the JWT so it
        // can refresh from the stored grant, otherwise the user would be logged out every
        // 15 minutes.
        Response.Cookies.Append(opts.CookieName, result.AccessToken, new CookieOptions
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
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var clientId = User.FindFirst(Constants.OAuth.AddonToken.ClientIdClaim)?.Value;

        if (!int.TryParse(userId, out var owner) || string.IsNullOrEmpty(clientId))
        {
            Response.Cookies.Delete(opts.CookieName, new CookieOptions { Path = "/" });
            return NoContent();
        }

        // The desktop is the only place the grant lives, so the local row goes only after
        // the desktop confirms it killed its side. Deleting locally on a failed revoke would
        // tell the user they are signed out while the grant stays refreshable over there for
        // the rest of its 30-day TTL. A dead channel never reaches here — the middleware's
        // gate answers 503 first — so this covers the desktop that is reachable but refusing.
        if (!await oauth.RevokeAsync(owner, clientId, ct))
            return StatusCode(StatusCodes.Status503ServiceUnavailable);

        await tokens.DeleteAsync(owner, clientId, ct);
        Response.Cookies.Delete(opts.CookieName, new CookieOptions { Path = "/" });
        return NoContent();
    }
}
