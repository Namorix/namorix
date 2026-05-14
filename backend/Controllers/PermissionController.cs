using backend.Middleware;
using backend.Responses;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/permissions")]
public class PermissionController(PermissionService permissionService): ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var permissions = await permissionService.GetAllPermissions();
        return Ok(ApiResponse.Ok(permissions));
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePermissionRequest request)
    {
        await permissionService.CreatePermission(request.Name, request.Value, request.Description);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpDelete("{value:int}")]
    public async Task<IActionResult> Delete(int value)
    {
        await permissionService.DeletePermission(value);
        return Ok(ApiResponse.Ok());
    }
}

public record CreatePermissionRequest
{
    public string Name { get; init; } = string.Empty;
    public int Value { get; init; }
    public string? Description { get; init; }
}