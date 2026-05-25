using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/settings")]
public class SettingsController(SettingsService settingsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var (proxies, origins, registerEnabled) = await settingsService.GetAllAsync();
        return Ok(ApiResponse<SettingsResponse>.Ok(new SettingsResponse
        {
            Proxies = proxies,
            Origins = origins,
            RegisterEnabled = registerEnabled
        }));
    }
    
    [HttpPut]
    public async Task<IActionResult> SetAll([FromBody] SettingsRequest request)
    {
        await settingsService.SetAllAsync(request.Proxies, request.Origins, request.RegisterEnabled);
        return Ok(ApiResponse.Ok());
    }
    
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
    
    [HttpGet("register")]
    public async Task<IActionResult> GetRegisterEnabled()
    {
        var enabled = await settingsService.IsRegisterEnabled();
        return Ok(ApiResponse<bool>.Ok(enabled));
    }
    
    [HttpPut("register")]
    public async Task<IActionResult> SetRegisterEnabled([FromBody] RegisterEnabledRequest request)
    {
        await settingsService.SetRegisterEnabled(request.RegisterEnabled);
        return Ok(ApiResponse.Ok());
    }
}

public class SettingsResponse
{
    public List<string> Proxies { get; init; } = [];
    public List<string> Origins { get; init; } = [];
    public bool RegisterEnabled { get; init; }
}
public class SettingsRequest
{
    public List<string> Proxies { get; init; } = [];
    public List<string> Origins { get; init; } = [];
    public bool RegisterEnabled { get; init; }
}

public class ProxiesRequest
{
    public List<string> Proxies { get; init; } = [];
}

public class OriginsRequest
{
    public List<string> Origins { get; init; } = [];
}

public class RegisterEnabledRequest
{
    public bool RegisterEnabled { get; init; }
}