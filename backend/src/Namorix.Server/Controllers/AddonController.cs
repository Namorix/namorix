using Docker.DotNet;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Namorix.Core.Config;
using Namorix.Core.Constants;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Constants;
using Namorix.Server.Models;
using Namorix.Server.Services;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/addons")]
public class AddonController(AddonService addonService, AddonTaskQueue taskQueue,
    CatalogService catalogService, IOptions<AddonCatalogConfig> catalogConfig) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var addons = await addonService.GetInstalledAddonsAsync();
        return Ok(ApiResponse.Ok(addons));
    }

    [HttpPost("install")]
    public async Task<IActionResult> Install([FromBody] InstallRequest request)
    {
        var task = new AddonTask
        {
            Type = AddonTaskType.Install,
            AddonId = request.Image.Replace("/", "-").Replace(":", "-"),
            InstallRequest = request,
        };
        await taskQueue.EnqueueAsync(task);
        return Ok(ApiResponse.Ok(new
        {
            taskId = task.Id,
            addonId = task.AddonId
        }));
    }

    [HttpPost("{id}/start")]
    public async Task<IActionResult> Start(string id)
    {
        var task = new AddonTask { Type = AddonTaskType.Start, AddonId = id };
        await taskQueue.EnqueueAsync(task);
        return Ok(ApiResponse.Ok(new
        {
            taskId = task.Id
        }));
    }

    [HttpPost("{id}/stop")]
    public async Task<IActionResult> Stop(string id)
    {
        var task = new AddonTask { Type = AddonTaskType.Stop, AddonId = id };
        await taskQueue.EnqueueAsync(task);
        return Ok(ApiResponse.Ok(new
        {
            taskId = task.Id
        }));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Remove(string id)
    {
        var task = new AddonTask { Type = AddonTaskType.Uninstall, AddonId = id };
        await addonService.SetTaskPending(id, AddonStatus.Uninstalling);
        await taskQueue.EnqueueAsync(task);
        return Ok(ApiResponse.Ok(new
        {
            taskId = task.Id
        }));
    }
    
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog()
    {
        var entries = await addonService.GetCatalogAsync();
        return Ok(ApiResponse.Ok(entries));
    }
    
    [HttpPost("catalog/sync")]
    public async Task<IActionResult> SyncCatalog()
    {
        var entries = await addonService.RefreshCatalogAsync(
            catalogService, catalogConfig.Value);
        return Ok(ApiResponse.Ok(entries));
    }
}