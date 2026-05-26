using Microsoft.AspNetCore.Http;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Core.Middleware;

public class JsonErrorMiddleware(RequestDelegate requestDelegate)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        if (HttpMethods.IsPost(httpContext.Request.Method) ||
            HttpMethods.IsPut(httpContext.Request.Method) ||
            HttpMethods.IsPatch(httpContext.Request.Method))
        {
            var hasBody = (httpContext.Request.ContentLength ?? 0) > 0;
            if (hasBody)
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
        }

        await requestDelegate(httpContext);


        if (httpContext.Response.StatusCode is StatusCodes.Status400BadRequest &&
            !httpContext.Items.ContainsKey(HttpContextKeys.Validated))
        {
            if (httpContext.Response.HasStarted) return;
            httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
            await httpContext.Response.WriteAsJsonAsync(
                ApiResponse.Fail(MiddlewareErrorCodes.InvalidRequestBody));
        }
    }
}