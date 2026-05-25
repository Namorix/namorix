using Microsoft.AspNetCore.Http;

namespace Namorix.Core.Middleware;

public class SecurityHeadersMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        httpContext.Response.Headers.XContentTypeOptions = "nosniff";
        httpContext.Response.Headers.XFrameOptions = "DENY";
        httpContext.Response.Headers.XXSSProtection = "0";
        httpContext.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        await requestDelegate(httpContext);
    }
}