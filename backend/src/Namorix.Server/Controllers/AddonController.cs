using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Middleware;
using Namorix.Server.Persistence;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/addons")]
public class AddonController(AddonService addonService, CatalogService catalogService,
    IOptions<AddonCatalogConfig> catalogConfig) : ControllerBase
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
    
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
    {
        var entries = await addonService.GetCatalogAsync();
        return Ok(new { success = true, data = entries });
    }
    
    [HttpPost("catalog/sync")]
    public async Task<IActionResult> SyncCatalog()
    {
        var entries = await addonService.RefreshCatalogAsync(
            catalogService, catalogConfig.Value);
        return Ok(new { success = true, data = entries });
    }
}