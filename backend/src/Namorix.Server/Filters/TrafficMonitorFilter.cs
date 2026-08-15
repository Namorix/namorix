using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.Filters;
using Namorix.Core.Helpers;
using Namorix.Core.Infrastructure;
using Namorix.Server.Attributes;
using Namorix.Server.Flatfile;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Filters;

public class TrafficMonitorFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ActionDescriptor.EndpointMetadata.Any(m => m is TrafficMonitorAttribute))
        {
            await next();
            return;
        }

        var httpContext = context.HttpContext;
        var originalBody = httpContext.Response.Body;
        var countingStream = new CountingStream(originalBody);
        httpContext.Response.Body = countingStream;

        var stopwatch = Stopwatch.StartNew();
        try
        {
            await next();
        }
        finally
        {
            stopwatch.Stop();
            httpContext.Response.Body = originalBody;

            var userId =
                httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value is { } v && int.TryParse(v, out var uid)
                    ? uid
                    : (int?)null;

            var log = new TrafficLogSerializer
            {
                Source = TrafficSource.Api,
                Method = httpContext.Request.Method,
                Path = httpContext.Request.Path.Value,
                StatusCode = httpContext.Response.StatusCode,
                DurationMs = stopwatch.ElapsedMilliseconds,
                ResponseSizeBytes = countingStream.BytesWritten,
                Ip = NetworkHelper.ToDisplayString(httpContext.Connection.RemoteIpAddress),
                UserId = userId
            };

            TrafficBuffer.Logs.Writer.TryWrite(log);
        }
    }
}