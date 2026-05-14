using Microsoft.AspNetCore.Mvc;

namespace backend.Responses;

public class ForbiddenObjectResult : ObjectResult
{
    public ForbiddenObjectResult(object? value) : base(value)
    {
        StatusCode = StatusCodes.Status403Forbidden;
    }
}