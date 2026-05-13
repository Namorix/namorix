using backend.Responses;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
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
}

public class ProxiesRequest
{
    public List<string> Proxies { get; init; } = [];
}