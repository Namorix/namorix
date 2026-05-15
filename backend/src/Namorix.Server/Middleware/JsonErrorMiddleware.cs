using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Server.Middleware;

public class JsonErrorMiddleware(RequestDelegate requestDelegate)
{
    private static ApiResponse StatusCodeResponseFail(int statusCode)
    {
        var errorMessage = statusCode switch
        {
            StatusCodes.Status415UnsupportedMediaType => "Content-Type must be application/json",
            _ => "Invalid request body"
        };
        
        var errorCode = statusCode switch
        {
            StatusCodes.Status415UnsupportedMediaType => MiddlewareErrorCodes.UnsupportedMediaType,
            _ => MiddlewareErrorCodes.InvalidRequestBody
        };
        
        return ApiResponse.Fail(errorCode, errorMessage);
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        if (HttpMethods.IsPost(httpContext.Request.Method) ||
            HttpMethods.IsPut(httpContext.Request.Method) ||
            HttpMethods.IsPatch(httpContext.Request.Method))
        {
            var contentType = httpContext.Request.ContentType;
            if (string.IsNullOrEmpty(contentType) ||
                !contentType.StartsWith(System.Net.Mime.MediaTypeNames.Application.Json,
                    StringComparison.OrdinalIgnoreCase))
            {
                httpContext.Response.StatusCode = StatusCodes.Status415UnsupportedMediaType;
                httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
                await httpContext.Response.WriteAsJsonAsync(
                    ApiResponse.Fail(MiddlewareErrorCodes.UnsupportedMediaType));
                return;
            }
        }

        await requestDelegate(httpContext);

        if (httpContext.Response.StatusCode is StatusCodes.Status400BadRequest &&
            !httpContext.Items.ContainsKey(HttpContextKeys.Validated))
        {
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            await httpContext.Response.WriteAsJsonAsync(
                ApiResponse.Fail(HttpErrorCodes.BadRequest));
        }
    }
}