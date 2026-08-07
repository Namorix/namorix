using System.Net.Mime;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class AcmeChallengeMiddleware(
    RequestDelegate next,
    AcmeChallengeStore store,
    ILogger<AcmeChallengeMiddleware> logger)
{
    public static readonly PathString ChallengePrefix = "/.well-known/acme-challenge";

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(ChallengePrefix, out var remaining))
        {
            var token = remaining.Value?.TrimStart('/');
            var found = token is not null && store.TryGet(token, out _);
            logger.LogInformation("ACME matched: token={Token} found={Found}", token, found);

            if (found)
            {
                context.Response.StatusCode = StatusCodes.Status200OK;
                context.Response.ContentType = MediaTypeNames.Text.Plain;
                await context.Response.WriteAsync(store.TryGet(token!, out var k) ? k : "");
                return;
            }
            
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }
        await next(context);
    }
}