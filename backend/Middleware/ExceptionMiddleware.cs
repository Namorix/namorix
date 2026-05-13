using backend.Constants;
using backend.Responses;

namespace backend.Middleware;

public class ExceptionMiddleware(RequestDelegate requestDelegate, ILogger<ExceptionMiddleware> logger)
{

    public async Task InvokeAsync(HttpContext httpContext)
    {
        var originalBody = httpContext.Response.Body;
        
        try
        {
            await requestDelegate(httpContext);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            httpContext.Response.Body = originalBody;
            httpContext.Response.ContentType = "application/json";
            httpContext.Response.StatusCode = 500;
            await httpContext.Response.WriteAsJsonAsync(ApiResponse.Fail(HttpErrorCodes.InternalError,
                "An unexpected error occurred"));
        }
    }
}