using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Namorix.Core.Attributes;
using Namorix.Core.Responses;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/health")]
[DisableRateLimiting]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(ApiResponse.Ok(new HealthResponse
        {
            Status = "healthy"
        }));
    }
}

public class HealthResponse
{
    public string Status { get; init; } = string.Empty;
}