using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Namorix.Core.Constants;
using Namorix.Core.Hubs;
using Namorix.Core.Middleware;
using Microsoft.Extensions.DependencyInjection;

namespace Namorix.Core.Extensions;

public static class ApplicationBuilderExtensions
{
    extension(IApplicationBuilder app)
    {
        public IApplicationBuilder UseNamorixCore(Action<IApplicationBuilder>? configurePipeline = null)
        {
            return app.UseNamorixCore<NmxHub>(configurePipeline);
        }

        public IApplicationBuilder UseNamorixCore<THub>(Action<IApplicationBuilder>? configurePipeline = null,
            Action<IEndpointRouteBuilder>? configureEndpoints = null) where THub : NmxHub
        {
            var options = app.ApplicationServices.GetService<NmxCoreOptions>();

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
                endpoints.MapHub<THub>(options?.HubPath ?? SignalRPath.HubNamorix);
                configureEndpoints?.Invoke(endpoints);
            });
    
            return app;
        }

        public void UseApiErrorHandling()
        {
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseMiddleware<JsonErrorMiddleware>();
        }

        public void UseCsrfProtection()
        {
            app.UseMiddleware<CsrfMiddleware>();
        }

        public void UseSecurityHeaders()
        {
            app.UseMiddleware<SecurityHeadersMiddleware>();
        }

        public void UseNotFoundHandler()
        {
            app.UseMiddleware<NotFoundMiddleware>();
        }

        public IApplicationBuilder UseChromeDevToolsProbe404()
        {
            // Chrome DevTools polls this path on page load; 404 it before session auth / YARP
            // so it neither triggers a session DB lookup nor gets proxied to the Vite dev server.
            app.Map("/.well-known/appspecific/com.chrome.devtools.json", static branch =>
            {
                branch.Run(static context =>
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    return Task.CompletedTask;
                });
            });
            return app;
        }
    }
}