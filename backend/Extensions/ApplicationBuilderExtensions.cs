using backend.Middleware;

namespace backend.Extensions;

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
}
