using Microsoft.AspNetCore.Mvc;
using Namorix.Core.FlatFile;
using Namorix.Core.Middleware;
using Namorix.Core.Services;

namespace Namorix.Core.Controllers;

// [RequireAdmin]
[ApiController]
[Route("api/logs")]
public class LogController(LogService logService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Query([FromQuery] LogFilter filter)
    {
        var entries = new List<LogEntrySerializer>();
        await foreach (var e in logService.QueryAsync(filter))
            entries.Add(e);
        
        var total = await logService.CountAsync(filter);
        return Ok(new { success = true, data = new { entries, total } });
    }
}