using Namorix.Core.Middleware;
using Namorix.Server.Middleware;

namespace Namorix.Server.Extensions;

public static class ApplicationBuilderExtensions
{

     extension(IApplicationBuilder applicationBuilder)
     {
         public void UseTrustedProxy()
         {
             applicationBuilder.UseMiddleware<TrustedProxyMiddleware>();
         }

         public void UseAuth()
         {
             applicationBuilder.UseMiddleware<AuthMiddleware>();
         }

         public void UseOAuth2()
         {
             applicationBuilder.UseMiddleware<OAuth2Middleware>();
         }
     }
}
