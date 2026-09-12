using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Middleware.Frontgate;

public class RewriteRedirectLocationMiddleware(RequestDelegate next, FrontgateProxyConfigProvider proxyConfig)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var originalHost = context.Request.Host.Host;
        var forwardedScheme = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();

        context.Response.OnStarting(() =>
        {
            var location = context.Response.Headers.Location.FirstOrDefault();
            if (string.IsNullOrEmpty(location))
                return Task.CompletedTask;

            var uri = new Uri(location, UriKind.RelativeOrAbsolute);
            if (!uri.IsAbsoluteUri)
            {
                var scheme = forwardedScheme ?? context.Request.Scheme;
                context.Response.Headers.Location = $"{scheme}://{originalHost}{location}";
                return Task.CompletedTask;
            }

            // Only rewrite redirects that point back at this rule's own upstream (the proxied
            // app redirecting to its internal address). A redirect to an unrelated host — e.g.
            // an OAuth client's redirect_uri — must pass through untouched.
            if (!string.Equals(uri.Host, originalHost, StringComparison.OrdinalIgnoreCase)
                && !TargetsOwnUpstream(originalHost, uri))
                return Task.CompletedTask;

            var builder = new UriBuilder(uri)
            {
                Host = originalHost, Port = -1
            };

            if (forwardedScheme != null)
                builder.Scheme = forwardedScheme;

            context.Response.Headers.Location = builder.ToString();
            return Task.CompletedTask;
        });

        await next(context);
    }

    private bool TargetsOwnUpstream(string sourceHost, Uri location)
    {
        if (!proxyConfig.DestinationSources.TryGetValue(sourceHost, out var destinations))
            return false;

        if (destinations.Contains($"{location.Host}:{location.Port}"))
            return true;

        // Destination may be configured as any loopback alias of the address the app reports.
        return IsLoopback(location.Host)
               && (destinations.Contains($"localhost:{location.Port}")
                   || destinations.Contains($"127.0.0.1:{location.Port}")
                   || destinations.Contains($"[::1]:{location.Port}"));
    }

    private static bool IsLoopback(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
        || host.Equals("::1", StringComparison.OrdinalIgnoreCase);
}
