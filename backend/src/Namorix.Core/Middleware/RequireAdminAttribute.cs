using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Core.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAdminAttribute() : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<RequireAdminAttribute>>();
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            logger.LogWarning("Unauthorized access attempt to {Path}", context.HttpContext.Request.Path);
            context.Result = new UnauthorizedObjectResult(ApiResponse.Fail(AuthErrors.Unauthorized));
            return;
        }
        
        var roleClaim = context.HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == JwtClaims.Role)?.Value;

        if (roleClaim != null &&
            int.TryParse(roleClaim, out var role) &&
            role == UserRole.Admin)
        {
            await next();
            return;
        }

        var username = context.HttpContext.User.FindFirst(JwtClaims.Username)?.Value;

        logger.LogWarning(
            "Forbidden: user '{Username}' (id {UserId}) attempted to access admin endpoint {Path}",
            username ?? "unknown", userId ?? "unknown", context.HttpContext.Request.Path);

        context.Result = new ForbiddenObjectResult(ApiResponse.Fail(AuthErrors.Forbidden));
    }
}