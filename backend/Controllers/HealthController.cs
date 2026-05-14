using backend.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers;

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