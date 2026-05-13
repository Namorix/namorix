using backend.Constants;
using backend.Responses;

namespace backend.Middleware;

public class JsonErrorMiddleware(RequestDelegate requestDelegate)
{
    private static ApiResponse StatusCodeResponseFail(int statusCode)
    {
        var errorMessage = statusCode switch
        {
            415 => "Content-Type must be application/json",
            _ => "Invalid request body"
        };
        
        var errorCode = statusCode switch
        {
            415 => HttpErrorCodes.UnsupportedMediaType,
            _ => HttpErrorCodes.InvalidRequestBody
        };
        
        return ApiResponse.Fail(errorCode, errorMessage);
    }
    
    public async Task InvokeAsync(HttpContext httpContext)
    {
        var originalBody = httpContext.Response.Body;
        using var buffer = new MemoryStream();
        httpContext.Response.Body = buffer;

        await requestDelegate(httpContext);

        if (httpContext.Response.StatusCode is 415 || 
            (httpContext.Response.StatusCode is 400 && !httpContext.Items.ContainsKey(HttpContextKeys.Validated)))
        {
            httpContext.Response.Body = originalBody;
            httpContext.Response.ContentType = "application/json";
            await httpContext.Response.WriteAsJsonAsync(StatusCodeResponseFail(httpContext.Response.StatusCode));
            return;
        }
        
        buffer.Seek(0, SeekOrigin.Begin);
        httpContext.Response.Body = originalBody;
        await buffer.CopyToAsync(originalBody);
    }
}