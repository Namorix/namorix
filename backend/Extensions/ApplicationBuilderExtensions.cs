using backend.Middleware;

namespace backend.Extensions;

public static class ApplicationBuilderExtensions
{
     public static void UseApiErrorHandling(this IApplicationBuilder applicationBuilder)
     {
         applicationBuilder.UseMiddleware<ExceptionMiddleware>();
         applicationBuilder.UseMiddleware<JsonErrorMiddleware>();
     }
}