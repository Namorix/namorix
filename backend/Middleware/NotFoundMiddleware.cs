using backend.Constants;
using backend.Responses;

namespace backend.Middleware;

public class NotFoundMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        await requestDelegate(httpContext);

        if (httpContext.Response.StatusCode == StatusCodes.Status404NotFound &&
            !httpContext.Response.HasStarted)
        {
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            await httpContext.Response.WriteAsJsonAsync(
                ApiResponse.Fail(HttpErrorCodes.NotFound, "Endpoint not found"));
        }
    }
}