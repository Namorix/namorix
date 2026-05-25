using Namorix.Core.Middleware;
using Namorix.Server.Middleware;

namespace Namorix.Server.Extensions;

public static class ApplicationBuilderExtensions
{

     public static void UseTrustedProxy(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<TrustedProxyMiddleware>();
     }

     public static void UseAuth(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<AuthMiddleware>();
     }
    
}
