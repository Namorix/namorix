using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Middleware;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/addons")]
public class AddonController(AddonService addonService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var addons = await addonService.GetInstalledAddonsAsync();
        return Ok(new { success = true, data = addons });
    }

    [HttpPost("install")]
    public async Task<IActionResult> Install([FromBody] InstallRequest request)
    {
        var addon = await addonService.InstallAddonAsync(request);
        return Ok(new { success = true, data = addon });
    }

    [HttpPost("{id}/start")]
    public async Task<IActionResult> Start(string id)
    {
        await addonService.StartAddonAsync(id);
        return Ok(new { success = true });
    }

    [HttpPost("{id}/stop")]
    public async Task<IActionResult> Stop(string id)
    {
        await addonService.StopAddonAsync(id);
        return Ok(new { success = true });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(string id)
    {
        await addonService.UninstallAddonAsync(id);
        return Ok(new { success = true });
    }
}