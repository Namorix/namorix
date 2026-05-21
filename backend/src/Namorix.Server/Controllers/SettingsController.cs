using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Attributes;
using Namorix.Core.Responses;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/settings")]
public class SettingsController(SettingsService settingsService) : ControllerBase
{
    [HttpGet("proxies")]
    public async Task<IActionResult> GetTrustedProxies()
    {
        var proxies = await settingsService.GetTrustedProxies();
        return Ok(ApiResponse.Ok(proxies));
    }

    [HttpPut("proxies")]
    public async Task<IActionResult> SetTrustedProxies([FromBody] ProxiesRequest request)
    {
        await settingsService.SetTrustedProxies(request.Proxies);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpGet("origins")]
    public async Task<IActionResult> GetAllowedOrigins()
    {
        var origins = await settingsService.GetAllowedOrigins();
        return Ok(ApiResponse.Ok(origins));
    }
    
    [HttpPut("origins")]
    public async Task<IActionResult> SetAllowedOrigins([FromBody] OriginsRequest request)
    {
        await settingsService.SetAllowedOrigins(request.Origins);
        return Ok(ApiResponse.Ok());
    }
}

public class ProxiesRequest
{
    public List<string> Proxies { get; init; } = [];
}

public class OriginsRequest
{
    public List<string> Origins { get; init; } = [];
}