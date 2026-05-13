using System.IdentityModel.Tokens.Jwt;
using backend.Config;
using backend.Constants;
using backend.Exceptions;
using backend.Responses;
using backend.Services;
using backend.Validation;
using backend.Validation.Schemas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, SettingsService settingsService, IOptions<JwtConfig> jwtConfig,
    IOptions<AppConfig> appConfig) : ControllerBase
{
    private readonly JwtConfig _jwtConfig = jwtConfig.Value;
    private readonly AppConfig _appConfig = appConfig.Value;
    
    [HttpPost("login")]
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

            return Ok(ApiResponse<UserResponse>.Ok(new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role
            }));
        }
        catch (AuthException ex) when(ex.Code == AuthErrors.InvalidCredentials)
        {
            return Unauthorized(ApiResponse.Fail(ex.Code, "Invalid username or password"));
        }
    }

    [HttpPost("register")]
    [Validate(typeof(RegisterSchema))]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var registerEnabled = await settingsService.IsRegisterEnabled();
        if (!registerEnabled)
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse.Fail(AuthErrors.RegisterClosed));

        try
        {
            var user = await authService.Register(request.Username, request.Password);
            return Ok(ApiResponse<UserResponse>.Ok(new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role
            }));
        }
        catch (AuthException ex) when (ex.Code == AuthErrors.UsernameExists)
        {
            return Conflict(ApiResponse.Fail(ex.Code));
        }
    }


    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = GetRefreshCookie();
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var jti = ExtractJtiFromToken(refreshToken);
            if (!string.IsNullOrEmpty(jti))
                await authService.RevokeToken(jti);
        }
        
        ClearAccessCookie();
        ClearRefreshCookie();

        return Ok(ApiResponse.Ok());
    }

    [HttpPost("logout-all")]
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

    [HttpGet("session")]
    public IActionResult Session()
    {
        var accessToken = GetAccessCookie();
        if (string.IsNullOrEmpty(accessToken))
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));

        var payload = authService.VerifyAccessToken(accessToken);
        if (!payload.HasValue)
            return Unauthorized(ApiResponse.Fail(AuthErrors.Unauthorized));
        
        return Ok(ApiResponse<UserResponse>.Ok(new UserResponse
        {
            Id = payload.Value.userId,
            Username = payload.Value.username,
            Role = payload.Value.role
        }));
    }


    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
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

            return Ok(ApiResponse<UserResponse>.Ok(new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role
            }));
        }
        catch (AuthException ex)
        {
            ClearAccessCookie();
            ClearRefreshCookie();
            return Unauthorized(ApiResponse.Fail(ex.Code));
        }
        catch
        {
            ClearAccessCookie();
            ClearRefreshCookie();
            return Unauthorized(ApiResponse.Fail(AuthErrors.InvalidToken));
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var (needsRegister, registerEnabled) = await settingsService.GetAuthStatus();
        return Ok(ApiResponse<StatusResponse>.Ok(new StatusResponse
        {
            NeedsRegister = needsRegister,
            RegisterEnabled = registerEnabled
        }));
    }
    
    private string? GetAccessCookie() => Request.Cookies[CookieName.AccessToken];
    private string? GetRefreshCookie() => Request.Cookies[CookieName.RefreshToken];

    private void SetAccessCookie(string token)
    {
        Response.Cookies.Append(CookieName.AccessToken, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = _appConfig.SecureCookie,
            Expires = DateTimeOffset.UtcNow.AddMinutes(_jwtConfig.AccessTokenExpirationMinutes)
        });
    }
    
    private void SetRefreshCookie(string token, bool rememberMe)
    {
        var days = rememberMe ? _jwtConfig.RefreshTokenExpirationDaysRemember : _jwtConfig.RefreshTokenExpirationDays;
        Response.Cookies.Append(CookieName.RefreshToken, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = _appConfig.SecureCookie,
            Expires = DateTimeOffset.UtcNow.AddDays(days)
        });
    }

    private void ClearAccessCookie() => Response.Cookies.Delete(CookieName.AccessToken);
    private void ClearRefreshCookie() => Response.Cookies.Delete(CookieName.RefreshToken);

    private static string CleanIp(string ip)
    {
        return ip.StartsWith("::ffff:", StringComparison.OrdinalIgnoreCase) ? ip[7..] : ip;
    }
    
    private string? GetClientIp()
    {
        var headers = Request.Headers;
        var ip = headers["cf-connecting-ip"].FirstOrDefault()
               ?? headers["x-forwarded-for"].FirstOrDefault()?.Split(",")[0].Trim()
               ?? headers["x-real-ip"].FirstOrDefault()
               ?? headers["x-client-ip"].FirstOrDefault()
               ?? headers["true-client-ip"].FirstOrDefault()
               ?? HttpContext.Connection.RemoteIpAddress?.ToString();

        return string.IsNullOrEmpty(ip) ? null : CleanIp(ip);
    }

    private string? GetFingerprint() =>
        Request.Headers["x-device-fingerprint"].FirstOrDefault();

    private string? GetUserAgent() => Request.Headers.UserAgent;

    private static string? ExtractJtiFromToken(string token)
    {
        try
        {
            var header = new JwtSecurityTokenHandler();
            var jwtToken = header.ReadJwtToken(token);
            return jwtToken.Claims.FirstOrDefault(c => c.Type == JwtClaims.Jti)?.Value;
        }
        catch
        {
            return null;
        }
    }
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
    
}