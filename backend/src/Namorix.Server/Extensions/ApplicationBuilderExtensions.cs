using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.EntityFrameworkCore;
using Namorix.Adapters.Persistence;
using Namorix.Core.Attributes;
using Namorix.Core.Models;
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

     public static async Task UseTrafficMonitorAsync(this IApplicationBuilder applicationBuilder)
     {
         using var scope = applicationBuilder.ApplicationServices.CreateScope();
         var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

         var existing = (await db.TrafficEndpoints.ToListAsync())
             .ToDictionary(e => (e.Method, e.Path));

         var controllerTypes = typeof(Program).Assembly.GetTypes()
             .Where(t => t.IsAssignableTo(typeof(ControllerBase)));

         foreach (var controller in controllerTypes)
         {
             var basePath = controller.GetCustomAttribute<RouteAttribute>()?.Template?.Trim('/') ?? "";

             foreach (var method in controller.GetMethods(
                          BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly))
             {
                 var httpAttr = method.GetCustomAttributes()
                     .OfType<HttpMethodAttribute>()
                     .FirstOrDefault();
                 
                 if (httpAttr == null)
                     continue;

                 if (httpAttr.GetType().GetProperty("Label") == null)
                     continue;

                 
                 var label = httpAttr.GetType().GetProperty("Label")?.GetValue(httpAttr) as string;
                 var httpMethod = httpAttr.HttpMethods.First();
                 var fullPath = "/" + string.Join("/", new[] { basePath, httpAttr.Template }
                     .Where(s => !string.IsNullOrEmpty(s)));
                 
                 if (existing.TryGetValue((httpMethod, fullPath), out var ep))
                 {
                     if (label != null)
                         ep.Label = label;
                 }
                 else
                 {
                     db.TrafficEndpoints.Add(new TrafficEndpoint
                     {
                         Method = httpMethod,
                         Path = fullPath,
                         Label = label
                     });
                 }
             }
         }

         await db.SaveChangesAsync();

         foreach (var ep in await db.TrafficEndpoints
                      .Where(e => e.IsEnabled)
                      .ToListAsync())
         {
             TrafficMonitorMiddleware.AddToRegistry(ep.Id, ep.Method, ep.Path);
         }

         applicationBuilder.UseMiddleware<TrafficMonitorMiddleware>();
     }
}
