using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Responses;
using Namorix.Server.Middleware;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/users/{userId:int}/permissions")]
public class UserPermissionController(PermissionService permissionService): ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(int userId)
    {
        var permissions = await permissionService.GetUserPermissions(userId);
        return Ok(ApiResponse.Ok(permissions));
    }
    
    [HttpPost]
    public async Task<IActionResult> Assign(int userId, [FromBody] AssignPermissionRequest request)
    {
        await permissionService.AssignPermission(userId, request.PermissionValue);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpDelete("{permissionValue:int}")]
    public async Task<IActionResult> Revoke(int userId, int permissionValue)
    {
        await permissionService.RevokePermission(userId, permissionValue);
        return Ok(ApiResponse.Ok());
    }
}

public record AssignPermissionRequest
{
    public int PermissionValue { get; init; }
}