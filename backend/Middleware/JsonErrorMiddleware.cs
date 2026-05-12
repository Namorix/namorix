using backend.Constants;
using backend.Responses;

namespace backend.Middleware;

public class JsonErrorMiddleware(RequestDelegate requestDelegate)
{
    private static ApiResponse StatusCodeResponseFail(int statusCode)
    {
        string errorCode;
        string errorMessage;

        if (statusCode == 415)
        {
            errorCode = HttpErrorCodes.UnsupportedMediaType;
            errorMessage = "Content-Type must be application/json";
        }
        else
        {
            errorCode = ValidationErrorCodes.ValidationError;
            errorMessage = "Invalid request body";
        }

        return ApiResponse.Fail(errorCode, errorMessage);
    }
    
    public async Task InvokeAsync(HttpContext httpContext)
    {
        var originalBody = httpContext.Response.Body;
        using var buffer = new MemoryStream();
        httpContext.Response.Body = buffer;

        await requestDelegate(httpContext);

        if (httpContext.Response.StatusCode is 415 or 400)
        {
            httpContext.Response.Body = originalBody;
            httpContext.Response.ContentType = "application/json";
            await originalBody.FlushAsync();
            await httpContext.Response.WriteAsJsonAsync(StatusCodeResponseFail(httpContext.Response.StatusCode));
            return;
        }

        buffer.Seek(0, SeekOrigin.Begin);
        httpContext.Response.Body = originalBody;
        await buffer.CopyToAsync(originalBody);
    }
}