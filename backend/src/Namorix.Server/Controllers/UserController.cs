using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Core.Validation.Schemas;
using Namorix.Server.Middleware;
using Namorix.Server.Services;

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
    [Validate(typeof(SetSettingsSchema))]
    public async Task<IActionResult> SetSettings(
        [FromBody] SetSettingsRequest request,
        [FromServices] UserSettingsService userSettingsService)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));
        var settings = request.ToDictionary();
        
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

public class SetSettingsRequest
{
    [JsonPropertyName(AppearanceSettingKeys.Theme)]
    public string? AppearanceTheme { get; init; }

    
    [JsonPropertyName(AppearanceSettingKeys.AccentColor)]
    public string? AppearanceAccentColor { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.Density)]
    public string? AppearanceDensity { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.FontFamily)]
    public string? AppearanceFontFamily { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.FontSize)]
    public string? AppearanceFontSize { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.Language)]
    public string? AppearanceLanguage { get; init; }


    [JsonPropertyName(AppearanceSettingKeys.TimeFormat)]
    public string? AppearanceTimeFormat { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.DateFormat)]
    public string? AppearanceDateFormat { get; init; }

    [JsonPropertyName(AppearanceSettingKeys.Collapsed)]
    public string? AppearanceCollapsed { get; init; }
    
    public Dictionary<string, string> ToDictionary()
    {
        var dict = new Dictionary<string, string>();

        if (AppearanceTheme != null)
            dict[AppearanceSettingKeys.Theme] = AppearanceTheme;
        
        if (AppearanceAccentColor != null)
            dict[AppearanceSettingKeys.AccentColor] = AppearanceAccentColor;
        
        if (AppearanceDensity != null)
            dict[AppearanceSettingKeys.Density] = AppearanceDensity;
        
        if (AppearanceFontFamily != null)
            dict[AppearanceSettingKeys.FontFamily] = AppearanceFontFamily;
        
        if (AppearanceFontSize != null)
            dict[AppearanceSettingKeys.FontSize] = AppearanceFontSize;
        
        if (AppearanceLanguage != null)
            dict[AppearanceSettingKeys.Language] = AppearanceLanguage;

        if (AppearanceTimeFormat != null)
            dict[AppearanceSettingKeys.TimeFormat] = AppearanceTimeFormat;

        if (AppearanceDateFormat != null)
            dict[AppearanceSettingKeys.DateFormat] = AppearanceDateFormat;
        
        if (AppearanceCollapsed != null)
            dict[AppearanceSettingKeys.Collapsed] = AppearanceCollapsed;
        
        return dict;
    }
}