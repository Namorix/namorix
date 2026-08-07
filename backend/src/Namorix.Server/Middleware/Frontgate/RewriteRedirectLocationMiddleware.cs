namespace Namorix.Server.Middleware.Frontgate;

public class RewriteRedirectLocationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var originalHost = context.Request.Host.Host;
            
        context.Response.OnStarting(() =>
        {
            var location = context.Response.Headers.Location.FirstOrDefault();
            if (string.IsNullOrEmpty(location))
                return Task.CompletedTask;

            var scheme = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault() 
                         ?? context.Request.Scheme;
            var uri = new Uri(location, UriKind.RelativeOrAbsolute);
            if (!uri.IsAbsoluteUri)
            {
                context.Response.Headers.Location = 
                    $"{scheme}://{originalHost}{location}";
            }
            else if (uri.Host != originalHost || uri.Port != (context.Request.Host.Port ?? -1))
            {
                var builder = new UriBuilder(uri)
                {
                    Scheme = scheme,
                    Host = originalHost,
                    Port = -1
                };
                context.Response.Headers.Location = builder.ToString();
            }

            return Task.CompletedTask;
        });

        await next(context);
    }
}
