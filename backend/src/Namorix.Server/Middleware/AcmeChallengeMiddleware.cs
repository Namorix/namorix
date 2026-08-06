using System.Net.Mime;
using Namorix.Server.Services;

namespace Namorix.Server.Middleware;

public class AcmeChallengeMiddleware(
    RequestDelegate next,
    AcmeChallengeStore store,
    ILogger<AcmeChallengeMiddleware> logger)
{
    private static readonly PathString ChallengePrefix = "/.well-known/acme-challenge";

    public async Task InvokeAsync(HttpContext context)
    {
        logger.LogWarning("ACME challenge hit: path={Path} port={Port}",
            context.Request.Path, context.Connection.LocalPort);

        if (context.Request.Path.StartsWithSegments(ChallengePrefix, out var remaining))
        {
            var token = remaining.Value?.TrimStart('/');
            var found = token is not null && store.TryGet(token, out _);
            logger.LogWarning("ACME matched: token={Token} found={Found}", token, found);

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