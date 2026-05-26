using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;
using Namorix.Core.Responses;

namespace Namorix.Core.Filters;

public class ValidationFilter(ILogger<ValidationFilter> logger) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.ModelState.IsValid)
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    e => e.Key,
                    e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());

            logger.LogWarning("Validation failed {Path}: {@Errors}",
                context.HttpContext.Request.Path, errors);

            context.Result = new BadRequestObjectResult(
                ApiResponse.Fail(MiddlewareErrorCodes.InvalidRequestBody));
            return;
        }

        await next();
    }
}