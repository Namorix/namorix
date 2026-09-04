namespace Namorix.Server.Middleware.Frontgate;

public class RewriteRedirectLocationMiddleware(RequestDelegate next)
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
            }
            else if (uri.Host != originalHost || uri.Port != (context.Request.Host.Port ?? -1))
            {
                var builder = new UriBuilder(uri)
                {
                    Host = originalHost, Port = -1
                };
                
                if (forwardedScheme != null) 
                    builder.Scheme = forwardedScheme;
                
                context.Response.Headers.Location = builder.ToString();
            }
            return Task.CompletedTask;
        });

        await next(context);
    }
}
