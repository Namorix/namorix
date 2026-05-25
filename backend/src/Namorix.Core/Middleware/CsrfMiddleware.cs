using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Core.Middleware;

public class CsrfMiddleware(RequestDelegate requestDelegate, IOptions<AppConfig> appConfig, ILogger<CsrfMiddleware> logger)
{
    private readonly AppConfig _appConfig = appConfig.Value;
    
    public async Task InvokeAsync(HttpContext httpContext)
    {
        if (!_appConfig.CsrfEnabled || httpContext.Request.Path.StartsWithSegments(SignalRPath.HubPrefix))
        {
            await requestDelegate(httpContext);
            return;
        }

        var token = httpContext.Request.Cookies[CookieName.CsrfToken] ??
                    Guid.NewGuid().ToString();
        
        httpContext.Response.Cookies.Append(CookieName.CsrfToken, token, new CookieOptions
        {
            // Must be false: JS needs to read this cookie to implement
            // the double-submit pattern (attach token to x-csrf-token header).
            // Trade-off: XSS can read the token, but XSS already
            // compromises the session entirely regardless.
            HttpOnly = false,
            SameSite = SameSiteMode.Lax,
            Secure = _appConfig.SecureCookie,
            MaxAge = TimeSpan.FromHours(2)
        });

        var method = httpContext.Request.Method;
        if (HttpMethods.IsPost(method) ||
            HttpMethods.IsPut(method) ||
            HttpMethods.IsPatch(method) ||
            HttpMethods.IsDelete(method))
        {
            var headerToken = httpContext.Request.Headers["x-csrf-token"].FirstOrDefault();

            if (string.IsNullOrEmpty(headerToken) ||
                !string.Equals(token, headerToken, StringComparison.Ordinal))
            {
                logger.LogError("CSRF validation failed: method={Method}, path={Path}",
                    httpContext.Request.Method, httpContext.Request.Path);
                
                httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                await httpContext.Response.WriteAsJsonAsync(
                    ApiResponse.Fail(MiddlewareErrorCodes.CsrfTokenMismatch, "CSRF validation failed"));
                return;
            }
        }

        await requestDelegate(httpContext);
    }
}