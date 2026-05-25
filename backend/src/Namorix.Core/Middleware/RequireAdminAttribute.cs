using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Core.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAdminAttribute : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
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

        context.Result = new ForbiddenObjectResult(ApiResponse.Fail(AuthErrors.Forbidden));
    }
}