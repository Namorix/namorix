using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Namorix.Adapters.Services;
using Namorix.Core.Attributes;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Exceptions;
using Namorix.Core.Models;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Core.Validation.Schemas;

namespace Namorix.Server.Controllers;

[TrafficMonitor]
[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, SettingsService settingsService,
    IOptions<AppConfig> appConfig) : ControllerBase
{
    private readonly AppConfig _appConfig = appConfig.Value;
    
    [TrafficPost("login", Label = "Auth Login")]
    [Validate(typeof(LoginSchema))]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var fingerprint = GetFingerprint();
            var ipAddress = GetClientIp();
            var userAgent = GetUserAgent();
            var (user, accessToken, refreshToken) = await authService.LoginWithTokens(request.Username,
                request.Password, request.RememberMe, userAgent, fingerprint, ipAddress);

            SetAccessCookie(accessToken);
            SetRefreshCookie(refreshToken, request.RememberMe);

            return UserOk(user);
        }
        catch (AuthException ex) when(ex.Code == AuthErrors.InvalidCredentials)
        {
            return Unauthorized(ApiResponse.Fail(ex.Code, "Invalid username or password"));
        }
    }

    [TrafficPost("register", Label = "Auth Register")]
    [Validate(typeof(RegisterSchema))]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (needsRegister, registerEnabled) = await settingsService.GetAuthStatus();
        if (!registerEnabled && !needsRegister)
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse.Fail(AuthErrors.RegisterClosed));

        try
        {
            var user = await authService.Register(request.Username, request.Password, request.Email, request.Name);

            var status = await settingsService.GetAuthStatus();
            if (!status.needsRegister)
                await settingsService.SetRegisterEnabled(false);
            
            return UserOk(user);
        }
        catch (AuthException ex) when (ex.Code == AuthErrors.UsernameExists)
        {
            return Conflict(ApiResponse.Fail(ex.Code));
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


    [TrafficPost("logout", Label = "Auth Logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = GetRefreshCookie();
        if (!string.IsNullOrEmpty(refreshToken))
            await authService.RevokeTokenByHash(refreshToken);
        
        ClearAccessCookie();
        ClearRefreshCookie();

        return Ok(ApiResponse.Ok());
    }

    [TrafficPost("logout-all", Label = "Auth Logout All")]
    public async Task<IActionResult> LogoutAll()
    {
        var accessToken = GetAccessCookie();
        if (!string.IsNullOrEmpty(accessToken))
        {
            var payload = authService.VerifyAccessToken(accessToken);
            if (payload.HasValue)
                await authService.RevokeAllUserTokens(payload.Value.userId);
        }
        
        ClearAccessCookie();
        ClearRefreshCookie();
        return Ok(ApiResponse.Ok());
    }

    [TrafficGet("session", Label = "Auth Session")]
    public async Task<IActionResult> Session()
    {
        var accessToken = GetAccessCookie();

        if (string.IsNullOrEmpty(accessToken))
            return await TryRefresh();

        var payload = authService.VerifyAccessToken(accessToken);

        if (!payload.HasValue)
            return await TryRefresh();

        var user = await authService.GetUserById(payload.Value.userId);
        if (user != null)
            return UserOk(user);

        ClearAccessCookie();
        ClearRefreshCookie();
        return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

    }
    
    [TrafficPost("refresh", Label = "Auth Refresh Token")]
    public async Task<IActionResult> Refresh()
    {
        return await TryRefresh();
    }

    [TrafficGet("status", Label = "Auth Status")]
    public async Task<IActionResult> Status()
    {
        var (needsRegister, registerEnabled) = await settingsService.GetAuthStatus();
        return Ok(ApiResponse<StatusResponse>.Ok(new StatusResponse
        {
            NeedsRegister = needsRegister,
            RegisterEnabled = registerEnabled
        }));
    }

    private OkObjectResult UserOk(User user) =>
        Ok(ApiResponse<UserResponse>.Ok(new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role
        }));
    
    private async Task<IActionResult> TryRefresh()
    {
        var refreshToken = GetRefreshCookie();
        
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        try
        {
            var fingerprint = GetFingerprint();
            var ipAddress = GetClientIp();
            var (user, newAccessToken, newRefreshToken) =
                await authService.RefreshToken(refreshToken, fingerprint, ipAddress);

            SetAccessCookie(newAccessToken);
            SetRefreshCookie(newRefreshToken, false);

            return UserOk(user);
        }
        catch (AuthException ex)
        {
            ClearAccessCookie();
            ClearRefreshCookie();
            return Unauthorized(ApiResponse.Fail(ex.Code));
        }
    }
    
    private string? GetAccessCookie() => Request.Cookies[CookieName.AccessToken];
    private string? GetRefreshCookie() => Request.Cookies[CookieName.RefreshToken];

    private void SetCookie(string name, string token, DateTime expires)
    {
        Response.Cookies.Append(name, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = _appConfig.SecureCookie,
            Expires = expires
        });
    }

    private void SetAccessCookie(string token) =>
        SetCookie(CookieName.AccessToken, token, authService.GetAccessTokenExpirationDateTime());

    private void SetRefreshCookie(string token, bool rememberMe) =>
        SetCookie(CookieName.RefreshToken, token, authService.GetRefreshTokenExpirationDatetime(rememberMe));

    private void ClearAccessCookie() => Response.Cookies.Delete(CookieName.AccessToken);
    private void ClearRefreshCookie() => Response.Cookies.Delete(CookieName.RefreshToken);

    private static string CleanIp(string ip)
    {
        return ip.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase) ? ip[7..] : ip;
    }
    
    private string? GetClientIp()
    {
        if (HttpContext.Items.TryGetValue(HttpContextKeys.RealIp, out var ip) &&
            ip is string realIp &&
            !string.IsNullOrEmpty(realIp))
        {
            return CleanIp(realIp);
        }
        
        return HttpContext.Connection.RemoteIpAddress == null
            ? null
            : CleanIp(HttpContext.Connection.RemoteIpAddress.ToString());
    }

    private string? GetFingerprint() =>
        Request.Headers["x-device-fingerprint"].FirstOrDefault();

    private string? GetUserAgent() => Request.Headers.UserAgent;
}

public class LoginRequest
{
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public bool RememberMe { get; init; } = false;
}

public class RegisterRequest
{
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;

}