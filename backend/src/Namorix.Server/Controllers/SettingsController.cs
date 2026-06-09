using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Data;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAuth]
[Route("api/settings")]
public class SettingsController(SettingsService settingsService) : ControllerBase
{
    [HttpGet("system")]
    [RequireAdmin]
    public async Task<IActionResult> GetSystem()
    {
        var (proxies, origins, registerEnabled) = await settingsService.GetAllAsync();
        return Ok(ApiResponse<SettingsResponse>.Ok(new SettingsResponse
        {
            Proxies = proxies,
            Origins = origins,
            RegisterEnabled = registerEnabled
        }));
    }
    
    [HttpPut("system")]
    [RequireAdmin]
    public async Task<IActionResult> SetSystem([FromBody] SettingsRequest request)
    {
        await settingsService.SetAllAsync(request.Proxies, request.Origins, request.RegisterEnabled);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpGet("appearance/options")]
    public IActionResult GetAppearanceOptions()
    {
        var options = SettingsService.GetAppearanceOptions();
        return Ok(ApiResponse<AppearanceOptionsData>.Ok(options));
    }
    
    [HttpPut("appearance")]
    [RequireAdmin]
    public async Task<IActionResult> SetAppearanceDefaults(
        [FromBody] Dictionary<string, string> settings)
    {
        await settingsService.SetAppearanceDefaultsAsync(settings);
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