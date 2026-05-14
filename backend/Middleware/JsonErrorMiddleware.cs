using backend.Constants;
using backend.Responses;

namespace backend.Middleware;

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
        // var originalBody = httpContext.Response.Body;
        // using var buffer = new MemoryStream();
        // httpContext.Response.Body = buffer;
        //
        // try
        // {
        //     await requestDelegate(httpContext);
        // }
        // finally
        // {
        //     httpContext.Response.Body = originalBody;
        // }
        //
        // if (httpContext.Response.StatusCode is StatusCodes.Status415UnsupportedMediaType || 
        //     (httpContext.Response.StatusCode is StatusCodes.Status400BadRequest &&
        //      !httpContext.Items.ContainsKey(HttpContextKeys.Validated)))
        // {
        //     httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
        //     await httpContext.Response.WriteAsJsonAsync(StatusCodeResponseFail(httpContext.Response.StatusCode));
        //     return;
        // }
        //
        // buffer.Seek(0, SeekOrigin.Begin);
        // await buffer.CopyToAsync(originalBody);

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