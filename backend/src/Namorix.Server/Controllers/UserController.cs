using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Attributes;
using Namorix.Core.Constants;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Core.Validation.Schemas;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[TrafficMonitor]
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
        [FromServices] UserService userService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        await userService.SetThemeAsync(userId.Value, request.ThemeId);
        return Ok(ApiResponse.Ok());
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