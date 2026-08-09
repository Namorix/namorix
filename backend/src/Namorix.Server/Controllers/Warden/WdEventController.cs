using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Models.Warden;
using Namorix.Server.Persistence;

namespace Namorix.Server.Controllers.Warden;

[ApiController]
[RequireAdmin]
[Route("api/warden/events")]
public class WdEventController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? ip = null,
        [FromQuery] string? type = null,
        [FromQuery] string? severity = null)
    {
        var query = db.WdSecurityEvents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(ip))
            query = query.Where(e => e.SourceIp != null && e.SourceIp.Contains(ip.Trim()));
        
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(e => e.EventType == type.Trim());
        
        if (!string.IsNullOrWhiteSpace(severity) &&
            Enum.TryParse<WdSeverity>(severity, ignoreCase: true, out var sev))
        {
            query = query.Where(e => e.Severity == sev);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.Timestamp)
            .ThenByDescending(e => e.Id)
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();

        return Ok(ApiResponse.Ok(new { items, total }));
    }
}