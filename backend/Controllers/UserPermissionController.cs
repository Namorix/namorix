using backend.Middleware;
using backend.Responses;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/users/{userId}/permissions")]
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