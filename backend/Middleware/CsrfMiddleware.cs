using backend.Config;
using backend.Constants;
using backend.Responses;
using Microsoft.Extensions.Options;

namespace backend.Middleware;

public class CsrfMiddleware(RequestDelegate requestDelegate, IOptions<AppConfig> appConfig)
{
    private readonly AppConfig _appConfig = appConfig.Value;
    
    public async Task InvokeAsync(HttpContext httpContext)
    {
        if (!_appConfig.CsrfEnabled)
        {
            await requestDelegate(httpContext);
            return;
        }

        if (!httpContext.Request.Cookies.ContainsKey(CookieName.CsrfToken))
        {
            var token = Guid.NewGuid().ToString();
            httpContext.Response.Cookies.Append(CookieName.CsrfToken, token, new CookieOptions
            {
                HttpOnly = false,
                SameSite = SameSiteMode.Lax,
                Secure = _appConfig.SecureCookie,
                MaxAge = TimeSpan.FromHours(2)
            });
        }

        var method = httpContext.Request.Method;
        if (HttpMethods.IsPost(method) ||
            HttpMethods.IsPut(method) ||
            HttpMethods.IsPatch(method) ||
            HttpMethods.IsDelete(method))
        {
            var cookieToken = httpContext.Request.Cookies[CookieName.CsrfToken];
            var headerToken = httpContext.Request.Headers["x-csrf-token"].FirstOrDefault();

            if (string.IsNullOrEmpty(cookieToken) ||
                string.IsNullOrEmpty(headerToken) ||
                !string.Equals(cookieToken, headerToken, StringComparison.Ordinal))
            {
                httpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                await httpContext.Response.WriteAsJsonAsync(
                    ApiResponse.Fail(HttpErrorCodes.CsrfTokenMismatch, "CSRF validation failed"));
                return;
            }
        }

        await requestDelegate(httpContext);
    }
}