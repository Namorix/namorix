using backend.Middleware;
using Microsoft.AspNetCore.HttpOverrides;

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


     public static void UseXForwardedHeaders(this IApplicationBuilder applicationBuilder)
     {
         var options = new ForwardedHeadersOptions
         {
             ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
         };
         
         // Mặc định ASP.NET Core chỉ trust forwarded headers từ localhost. Nếu deploy sau nginx/Caddy/Cloudflare,
         // IP proxy không nằm trong "known" list → header bị ignore → GetClientIp() trả về IP của proxy chứ không phải IP client thật.
         
         options.KnownNetworks.Clear();
         options.KnownProxies.Clear();
         applicationBuilder.UseForwardedHeaders(options);
     }
}
