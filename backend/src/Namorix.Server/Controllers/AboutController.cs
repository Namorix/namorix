using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Namorix.Core.Responses;

namespace Namorix.Server.Controllers;

[ApiController]
[Route("api/about")]
public class AboutController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(ApiResponse.Ok(new AboutResponse
        {
            Core = ReadInformationalVersion(typeof(ApiResponse).Assembly),
            Server = ReadInformationalVersion(typeof(AboutController).Assembly),
        }));
    }

    private static string ReadInformationalVersion(Assembly assembly) =>
        assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion.Split('+')[0] ?? "0.0.0";
}

public class AboutResponse
{
    public string Core { get; init; } = string.Empty;
    public string Server { get; init; } = string.Empty;
}
