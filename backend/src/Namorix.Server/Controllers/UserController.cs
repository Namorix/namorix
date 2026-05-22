using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Infrastructure;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Core.Validation.Schemas;
using Namorix.Server.Hubs;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAuth]
[Route("api/user")]
public class UserController : ControllerBase
{
    [HttpGet("theme")]
    public async Task<IActionResult> GetTheme([FromServices] UserService userService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        var themeId = await userService.GetThemeAsync(userId.Value);
        return Ok(ApiResponse<object>.Ok(new { themeId }));
    }

    [HttpPut("theme")]
    [Validate((typeof(SetThemeSchema)))]
    public async Task<IActionResult> SetTheme(
        [FromBody] SetThemeRequest request,
        [FromServices] UserService userService,
        [FromServices] IHubContext<NmxHub> hubContext)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        await userService.SetThemeAsync(userId.Value, request.ThemeId);
        await hubContext.Clients.User(userId.Value.ToString())
            .SendAsync(SignalREvents.UserThemeChanged, new ThemeChanged(request.ThemeId));
        return Ok(ApiResponse.Ok());
    }

    [HttpPut("password")]
    [Validate(typeof(ChangePasswordSchema))]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] UserService userService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        try
        {
            await userService.ChangePasswordAsync(userId.Value, request.CurrentPassword, request.NewPassword);
            return Ok(ApiResponse.Ok());
        }
        catch (AuthException ex) when (ex.Code == AuthErrors.IncorrectPassword)
        {
            return Unauthorized(ApiResponse.Fail(ex.Code, "Current password is incorrect"));
        }
    }

    
    private int? GetUserId()
    {
        var claim = User.FindFirst(JwtClaims.UserId)?.Value;
        return claim != null && int.TryParse(claim, out var id) ? id : null;
    }
}

public class SetThemeRequest
{
    public string ThemeId { get; init; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}