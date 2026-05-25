using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Services;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/traffic/logs")]
public class TrafficMonitorController(TrafficMonitorService trafficMonitorService): ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int size = 30,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] string? search = null)
    {
        var (items, total, elapsedMs) = await trafficMonitorService
            .GetLogs(page, size, from, to, search);
        return Ok(ApiResponse.Ok(new { items, total, elapsedMs }));
    }
    
    [HttpDelete]
    public async Task<IActionResult> ClearLogs([FromQuery] DateTime? before = null)
    {
        await trafficMonitorService.ClearLogs(before);
        return Ok(ApiResponse.Ok());
    }
}

public class RegisterEndpointRequest
{
    public string Method { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string? Label { get; init; }
}