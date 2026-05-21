using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Server.Middleware;

public class NotFoundMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        await requestDelegate(httpContext);

        if (httpContext.Response is { StatusCode: StatusCodes.Status404NotFound, HasStarted: false })
        {
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            await httpContext.Response.WriteAsJsonAsync(
                ApiResponse.Fail(HttpErrorCodes.NotFound, "Endpoint not found"));
        }
    }
}