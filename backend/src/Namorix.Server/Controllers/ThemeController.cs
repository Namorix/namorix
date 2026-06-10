using Microsoft.AspNetCore.Mvc;
using Namorix.Adapters.Services;
using Namorix.Core.Attributes;
using Namorix.Core.Models;
using Namorix.Core.Responses;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/themes")]
public class ThemeController(ThemeService themeService): ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var themes = await ThemeService.GetAllAsync();
        return Ok(ApiResponse<IReadOnlyList<ThemeManifest>>.Ok(themes));
    }
}