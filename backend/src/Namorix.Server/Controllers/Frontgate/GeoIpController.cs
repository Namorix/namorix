using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Constants;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Controllers.Frontgate;

[ApiController]
[RequireAdmin]
[Route("api/frontgate/geoip")]
public class GeoIpController(GeoIpService geoIpService) : ControllerBase
{
    [HttpGet]
    public IActionResult Status() => Ok(ApiResponse.Ok(geoIpService.GetStatus()));

    [HttpPost]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> Upload(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.GeoIpFileRequired));

        await using var stream = file.OpenReadStream();
        if (!geoIpService.TryUpdateDatabase(stream, out var error))
            return BadRequest(ApiResponse.Fail(FgErrorCodes.GeoIpInvalid, error));

        return Ok(ApiResponse.Ok(geoIpService.GetStatus()));
    }
    
    [HttpPost("rollback")]
    public IActionResult Rollback()
    {
        if (!geoIpService.RollbackDatabase(out var error))
            return BadRequest(ApiResponse.Fail(FgErrorCodes.GeoIpRollbackFailed, error));
        return Ok(ApiResponse.Ok(geoIpService.GetStatus()));
    }
}