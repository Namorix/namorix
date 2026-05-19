using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Attributes;
using Namorix.Core.Responses;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[TrafficMonitor]
[ApiController]
[RequireAdmin]
[Route("api/traffic")]
public class TrafficMonitorController(TrafficMonitorService trafficMonitorService): ControllerBase
{
    [HttpGet("endpoints")]
    public async Task<IActionResult> ListEndpoints()
    {
        var endpoints = await trafficMonitorService.ListEndpoints();
        return Ok(ApiResponse.Ok(endpoints));
    }

    [HttpPost("endpoints")]
    public async Task<IActionResult> RegisterEndpoint([FromBody] RegisterEndpointRequest request)
    {
        var endpoint = await trafficMonitorService.RegisterEndpoint(request.Method, request.Path, request.Label);
        return Ok(ApiResponse.Ok(endpoint));
    }

    [HttpDelete("endpoints/{id:int}")]
    public async Task<IActionResult> RemoveEndpoint(int id)
    {
        await trafficMonitorService.RemoveEndpoint(id);
        return Ok(ApiResponse.Ok());
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int size = 50,
        [FromQuery] int? ep = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var (items, total) = await trafficMonitorService.GetLogs(page, size, ep, from, to);
        return Ok(ApiResponse.Ok(new { items, total }));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var stats = await trafficMonitorService.GetStats(from, to);
        return Ok(ApiResponse.Ok(stats));
    }

    [HttpDelete("logs")]
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