using backend.Constants;
using backend.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAdminAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedObjectResult(ApiResponse.Fail(AuthErrors.Unauthorized));
            return;
        }
        
        var roleClaim = context.HttpContext.User.Claims
            .FirstOrDefault(c => c.Type == JwtClaims.Role)?.Value;
        
        if (roleClaim == UserRole.Admin.ToString())
            return;

        context.Result = new ForbiddenObjectResult(ApiResponse.Fail(AuthErrors.Forbidden));
    }
}