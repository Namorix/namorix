using System.Security.Claims;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;

namespace Namorix.Server.Middleware;

public class AuthMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext, AuthService authService)
    {
        var accessToken = httpContext.Request.Cookies[CookieName.AccessToken];
        if (!string.IsNullOrEmpty(accessToken))
        {
            var payload = authService.VerifyAccessToken(accessToken);
            if (payload.HasValue)
            {
                var claims = new[]
                {
                    new Claim(JwtClaims.UserId, payload.Value.userId.ToString()),
                    new Claim(JwtClaims.Username, payload.Value.username),
                    new Claim(JwtClaims.Role, payload.Value.role.ToString())
                };
                var identity = new ClaimsIdentity(claims, "nmx");
                httpContext.User = new ClaimsPrincipal(identity);
            }
        }

        await requestDelegate(httpContext);
    }
}