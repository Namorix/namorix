using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Constants;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/notifications")]
[RequireAuth]
public class NotificationController(NotificationService notifService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var (items, totalCount) = await notifService.GetNotificationsAsync(userId, page, pageSize);
        return Ok(ApiResponse<object>.Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            hasMore = page * pageSize < totalCount,
        }));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await notifService.GetUnreadCountAsync(userId);
        return Ok(ApiResponse<int>.Ok(count));
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetUserId();
        var result = await notifService.MarkAsReadAsync(userId, id);
        
        if (!result)
            return NotFound(ApiResponse.Fail(HttpErrorCodes.NotFound));
        
        return Ok(ApiResponse.Ok());
    }

    [HttpDelete("read")]
    public async Task<IActionResult> DeleteRead()
    {
        var userId = GetUserId();
        await notifService.DeleteReadAsync(userId);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        var count = await notifService.MarkAllAsReadAsync(userId);
        return Ok(ApiResponse<int>.Ok(count));
    }
    
    private int GetUserId()
    {
        var claim = User.FindFirst(JwtClaims.UserId)?.Value;
        return claim != null && int.TryParse(claim, out var id) ? id : 0;
    }

}