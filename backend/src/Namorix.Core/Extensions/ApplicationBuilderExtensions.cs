using Microsoft.AspNetCore.Builder;
using Namorix.Core.Constants;
using Namorix.Core.Hubs;
using Namorix.Core.Middleware;

namespace Namorix.Core.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseNamorixCore(
        this IApplicationBuilder app,
        Action<IApplicationBuilder>? configurePipeline = null)
    {
        app.UseApiErrorHandling();
        app.UseSecurityHeaders();
    
        configurePipeline?.Invoke(app); // CORS → Auth → TrustedProxy
    
        app.UseNotFoundHandler();
        app.UseCsrfProtection();
        app.UseRouting();
        app.UseRateLimiter();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapHub<NmxHub>(SignalRPath.HubMain);
        });
    
        return app;
    }

    private static void UseApiErrorHandling(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseMiddleware<ExceptionMiddleware>();
        applicationBuilder.UseMiddleware<JsonErrorMiddleware>();
    }

    private static void UseCsrfProtection(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseMiddleware<CsrfMiddleware>();
    }

    private static void UseSecurityHeaders(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseMiddleware<SecurityHeadersMiddleware>();
    }

    private static void UseNotFoundHandler(this IApplicationBuilder applicationBuilder)
    {
        applicationBuilder.UseMiddleware<NotFoundMiddleware>();
    }
}