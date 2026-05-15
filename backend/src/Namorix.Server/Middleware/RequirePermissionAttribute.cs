using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Server.Middleware;

[AttributeUsage(AttributeTargets.Method)]
public class RequirePermissionAttribute(int permissionValue): ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        var user = httpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedObjectResult(ApiResponse.Fail(AuthErrors.Unauthorized));
            return;
        }

        var userIdClaim = user.Claims.FirstOrDefault(c => c.Type == JwtClaims.UserId)?.Value;
        if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
        {
            context.Result = new ForbiddenObjectResult(ApiResponse.Fail(AuthErrors.Forbidden));
            return;
        }

        var permissionService = httpContext.RequestServices.GetRequiredService<PermissionService>();
        if (!await permissionService.HasPermission(userId, permissionValue))
        {
            context.Result = new ForbiddenObjectResult(ApiResponse.Fail(AuthErrors.Forbidden));
            return;
        }

        await next();
    }
}