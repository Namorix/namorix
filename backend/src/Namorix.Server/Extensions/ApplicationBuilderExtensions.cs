using Namorix.Server.Middleware;

namespace Namorix.Server.Extensions;

public static class ApplicationBuilderExtensions
{
     public static void UseApiErrorHandling(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<ExceptionMiddleware>();
         applicationBuilder.UseMiddleware<JsonErrorMiddleware>();
     }

     public static void UseCsrfProtection(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<CsrfMiddleware>();
     }

     public static void UseSecurityHeaders(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<SecurityHeadersMiddleware>();
     }


     public static void UseTrustedProxy(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<TrustedProxyMiddleware>();
     }

     public static void UseAuth(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<AuthMiddleware>();
     }

     public static void UseNotFoundHandler(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<NotFoundMiddleware>();
     }

     public static void UseTrafficMonitor(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<TrafficMonitorMiddleware>();
     }
}
