using Microsoft.AspNetCore.Mvc;
using Namorix.Core.FlatFile;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Services;

namespace Namorix.Core.Controllers;

[RequireAdmin]
[ApiController]
[Route("api/logs")]
public class LogController(LogService logService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Query([FromQuery] LogQueryRequest request)
    {
        var filter = new LogFilter
        {
            Page = request.Page,
            PageSize = request.PageSize,
            Levels = request.Levels?
                .Split(',')
                .Select(v => int.TryParse(v, out var l) ? l : (int?)null)
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .ToArray(),
            Source = request.Source,
            From = request.From,
            To = request.To,
        };
        
        var entries = new List<LogEntrySerializer>();
        await foreach (var e in logService.QueryAsync(filter))
            entries.Add(e);
        var total = await logService.CountAsync(filter);
        return Ok(ApiResponse.Ok(new { entries, total }));
    }
}

public record LogQueryRequest
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
    public string? Levels { get; init; }
    public string? Source { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
}
