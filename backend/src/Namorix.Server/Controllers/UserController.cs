using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Core.Validation.Schemas;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAuth]
[Route("api/user")]
public class UserController : ControllerBase
{
    [HttpPut("profile")]
    [Validate(typeof(UpdateProfileSchema))]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] UserService userService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));
        try
        {
            await userService.UpdateProfileAsync(userId.Value, request.Email, request.Name);
            return Ok(ApiResponse.Ok());
        }
        catch (AuthException ex) when (ex.Code == AuthErrors.EmailExists)
        {
            return Conflict(ApiResponse.Fail(ex.Code));
        }
        catch (AuthException ex) when (ex.Code == AuthErrors.NameExists)
        {
            return Conflict(ApiResponse.Fail(ex.Code));
        }
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

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(
        [FromServices] UserSettingsService userSettingsService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));
        var settings = await userSettingsService.GetAllAsync(userId.Value);
        return Ok(ApiResponse<Dictionary<string, string>>.Ok(settings));
    }
    
    [HttpPut("settings")]
    public async Task<IActionResult> SetSettings(
        [FromBody] Dictionary<string, string> settings,
        [FromServices] UserSettingsService userSettingsService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));
        await userSettingsService.SetBatchAsync(userId.Value, settings);
        return Ok(ApiResponse.Ok());
    }
    
    private int? GetUserId()
    {
        var claim = User.FindFirst(JwtClaims.UserId)?.Value;
        return claim != null && int.TryParse(claim, out var id) ? id : null;
    }
}

public class UpdateProfileRequest
{
    public string Email { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}