using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Namorix.Core.Constants;
using Namorix.Core.Hubs;
using Namorix.Core.Middleware;

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
                endpoints.MapHub<THub>(SignalRPath.HubNamorix);
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
    }
}