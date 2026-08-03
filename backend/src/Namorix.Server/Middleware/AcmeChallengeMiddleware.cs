using Namorix.Server.Services;

namespace Namorix.Server.Middleware;

public class AcmeChallengeMiddleware(RequestDelegate next, AcmeChallengeStore store)
{
    private static readonly PathString ChallengePrefix = "/.well-known/acme-challenge/";

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments(ChallengePrefix, out var remaining))
        {
            var token = remaining.Value?.TrimStart('/');
            if (!string.IsNullOrEmpty(token) && store.TryGet(token, out var keyAuthorization))
            {
                context.Response.StatusCode = 200;
                context.Response.ContentType = "text/plain";
                await context.Response.WriteAsync(keyAuthorization);
                return;
            }
            context.Response.StatusCode = 404;
            return;
        }
        await next(context);
    }
}