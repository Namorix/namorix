using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Controllers.Frontgate;

[ApiController]
[RequireAdmin]
[Route("api/frontgate/audit")]
public class AuditLogController(AppDbContext db, IFrontgateNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? targetType = null,
        [FromQuery] string? targetId = null)
    {
        var query = db.FgAuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(targetType) &&
            Enum.TryParse<FgAuditTargetType>(targetType, ignoreCase: true, out var tt))
        {
            query = query.Where(l => l.TargetType == tt);
        }

        if (!string.IsNullOrWhiteSpace(targetId))
            query = query.Where(l => l.TargetId == targetId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.Timestamp)
            .ThenByDescending(l => l.Id)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();

        return Ok(ApiResponse.Ok(new { items, total }));
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        var deleted = await db.FgAuditLogs.ExecuteDeleteAsync();

        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Audit,
            null, null, FgAuditAction.AuditCleared,
            after: JsonSerializer.Serialize(new { deleted }, FrontgateAudit.JsonOptions));

        return Ok(ApiResponse.Ok(new { deleted }));
    }
}