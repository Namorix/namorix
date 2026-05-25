using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Server.Middleware;

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
            
            if (httpContext.Response.HasStarted)
            {
                logger.LogWarning("Response already started, cannot write error response");
                return;
            }
            
            httpContext.Response.Body = originalBody;
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await httpContext.Response.WriteAsJsonAsync(ApiResponse.Fail(HttpErrorCodes.InternalError,
                "An unexpected error occurred"));
        }
        finally
        {
            httpContext.Response.Body = originalBody;
        }
    }
}