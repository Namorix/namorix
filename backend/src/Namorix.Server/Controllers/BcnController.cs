using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Namorix.Server.Services;
using Namorix.Server.Services.BcnProviders;
using Namorix.Server.Validation;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/beacon")]
public class BcnController(AppDbContext db, BcnProviderRegistry registry, BcnSecretProtector protector,
    BcnUpdateQueue queue) : ControllerBase
{
    private static readonly JsonSerializerOptions ConfigWriteOptions =
        new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new JsonStringEnumConverter() }, 
        };
    
    [HttpGet("hostnames")]
    public async Task<IActionResult> ListHostnames([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var query = db.BcnHostnames.OrderByDescending(h => h.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        return Ok(ApiResponse.Ok(new { items, total }));
    }

    [HttpPost("hostnames")]
    [Validate(typeof(BcnHostnameSchema))]
    public async Task<IActionResult> CreateHostname([FromBody] CreateHostnameRequest request)
    {
        if (await db.BcnHostnames.AnyAsync(h => h.Hostname == request.Hostname))
            return Conflict(ApiResponse.Fail(BcnErrorCodes.DuplicateHostname));

        var config = DeserializeConfig(request.ConfigJson);
        config.Kind = Enum.Parse<BcnProviderKind>(request.Kind, ignoreCase: true);

        var invalidField = ValidateConfig(request.ProviderId, config);
        if (invalidField is not null)
            return BadRequest(ApiResponse.Fail(BcnErrorCodes.ConfigInvalid, null, invalidField));

        var host = new BcnHostname
        {
            Hostname = request.Hostname,
            ProviderId = request.ProviderId,
            Kind = config.Kind,
            Status = BcnHostnameStatus.Pending,
            ConfigJson = JsonSerializer.Serialize(protector.Protect(config), BcnProviderConfig.SerializerOptions),
        };
        db.BcnHostnames.Add(host);
        await db.SaveChangesAsync();
        await queue.EnqueueAsync(host.Id);
        return Ok(ApiResponse.Ok(host));
    }
    
    [HttpGet("hostnames/{id}")]
    public async Task<IActionResult> GetHostname(string id)
    {
        var host = await db.BcnHostnames.FindAsync(id);
        if (host == null)
            return NotFound(ApiResponse.Fail(BcnErrorCodes.HostnameNotFound));
        
        return Ok(ApiResponse.Ok(host));
    }

    [HttpPut("hostnames/{id}")]
    [Validate(typeof(BcnHostnameSchema))]
    public async Task<IActionResult> UpdateHostname(string id, [FromBody] CreateHostnameRequest request)
    {
        var host = await db.BcnHostnames.FindAsync(id);
        if (host == null) return NotFound(ApiResponse.Fail(BcnErrorCodes.HostnameNotFound));

        if (request.Hostname != host.Hostname &&
            await db.BcnHostnames.AnyAsync(h => h.Hostname == request.Hostname))
            return Conflict(ApiResponse.Fail(BcnErrorCodes.DuplicateHostname));

        var config = DeserializeConfig(request.ConfigJson);
        config.Kind = Enum.Parse<BcnProviderKind>(request.Kind, ignoreCase: true);

        var invalidField = ValidateConfig(request.ProviderId, config);
        if (invalidField is not null)
            return BadRequest(ApiResponse.Fail(BcnErrorCodes.ConfigInvalid, null, invalidField));

        host.Hostname = request.Hostname;
        host.ProviderId = request.ProviderId;
        host.Kind = config.Kind;
        host.ConfigJson = JsonSerializer.Serialize(protector.Protect(config), ConfigWriteOptions);
        host.Status = BcnHostnameStatus.Pending;

        await db.SaveChangesAsync();
        await queue.EnqueueAsync(host.Id);
        return Ok(ApiResponse.Ok(host));
    }

    [HttpDelete("hostnames/{id}")]
    public async Task<IActionResult> DeleteHostname(string id)
    {
        var host = await db.BcnHostnames.FindAsync(id);
        if (host == null)
            return NotFound(ApiResponse.Fail(BcnErrorCodes.HostnameNotFound));
        
        db.BcnHostnames.Remove(host);   // FK SetNull → activity.HostnameId null
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok());
    }

    [HttpPost("hostnames/test")]
    [Validate(typeof(BcnHostnameTestSchema))]
    public async Task<IActionResult> TestProvider(
        [FromBody] TestProviderRequest request,
        CancellationToken ct,
        [FromServices] IPublicIpDetector ipDetector,
        [FromServices] BcnProviderResolver resolver)
    {
        var config = DeserializeConfig(request.ConfigJson);
        config.Kind = Enum.Parse<BcnProviderKind>(request.Kind, ignoreCase: true);
        protector.Unprotect(config);   // Encrypted blob (edit form keeping secret) -> decrypt; plaintext (new form) -> keep as-is


        var settings = await db.BcnSettings.FirstOrDefaultAsync(cancellationToken: ct);
        var ip = await ipDetector.DetectAsync(
            settings?.IpDetectionService ?? PublicIpServices.Auto,
            settings?.UpdateIpv6 ?? false, ct);
        
        if (!ip.HasAny)
            return Ok(ApiResponse.Ok(new { success = false, code = BcnErrorCodes.NoIp }));

        var result = await resolver.Resolve(request.ProviderId, config)
            .TestAsync(request.Hostname ?? "test.example.com", config, ip.IPv4, ip.IPv6, ct);
        
        return Ok(ApiResponse.Ok(new { success = result.Success, code = result.Code, @params = result.Params }));
    }

    [HttpPost("hostnames/{id}/check")]
    public async Task<IActionResult> CheckHostname(string id,
        CancellationToken ct,
        [FromServices] IPublicIpDetector ipDetector,
        [FromServices] BcnHostnameService updater)
    {
        var host = await db.BcnHostnames.FindAsync([id], ct);
        if (host == null)
            return NotFound(ApiResponse.Fail(BcnErrorCodes.HostnameNotFound));

        var settings = await db.BcnSettings.FirstOrDefaultAsync(cancellationToken: ct);
        var ip = await ipDetector.DetectAsync(
            settings?.IpDetectionService ?? PublicIpServices.Auto,
            settings?.UpdateIpv6 ?? false, ct);
        if (!ip.HasAny)
            return Ok(ApiResponse.Ok(new { success = false, code = BcnErrorCodes.NoIp }));

        var result = await updater.UpdateHostAsync(host, ip.IPv4, ip.IPv6, force: true, ct);
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse.Ok(new { success = result.Success,
            code = result.Success ? null : result.Code,
            @params = result.Params }));
    }
    
    [HttpGet("activity")]
    public async Task<IActionResult> ListActivity([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var query = db.BcnActivityLogs
            .OrderByDescending(l => l.Timestamp)
            .Select(l => new
            {
                l.Id,
                l.Timestamp,
                l.Level,
                l.Code,
                l.ParamsJson,
                hostname = l.Hostname != null ? l.Hostname.Hostname : null,
            });

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * size).Take(size).ToListAsync();
        return Ok(ApiResponse.Ok(new { items, total }));
    }
    
    [HttpDelete("activity")]
    public async Task<IActionResult> ClearActivity()
    {
        var deleted = await db.BcnActivityLogs.ExecuteDeleteAsync();
        return Ok(ApiResponse.Ok(new { deleted }));
    }

    [HttpGet("providers")]
    public IActionResult ListProviders([FromServices] BcnProviderRegistry providerRegistry)
        => Ok(ApiResponse.Ok(providerRegistry.Infos));

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await db.BcnSettings.FirstOrDefaultAsync() ?? new BcnSettings();
        return Ok(ApiResponse.Ok(settings));
    }

    [HttpPut("settings")]
    [Validate(typeof(BcnSettingsSchema))]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var settings = await db.BcnSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new BcnSettings();
            db.BcnSettings.Add(settings);
        }
        settings.CheckIntervalMinutes = request.CheckIntervalMinutes;
        settings.HeartbeatIntervalHours = request.HeartbeatIntervalHours;
        settings.IpDetectionService = request.IpDetectionService;
        settings.UpdateIpv6 = request.UpdateIpv6;
        
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(settings));
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var total = await db.BcnHostnames.CountAsync();
        var healthy = await db.BcnHostnames.CountAsync(h => h.Status == BcnHostnameStatus.Active);
        var lastCheck = await db.BcnHostnames.MaxAsync(h => h.LastCheckedAt);
        return Ok(ApiResponse.Ok(new { total, healthy, lastCheck }));
    }

    [HttpPost("hostnames/{id}/toggle")]
    public async Task<IActionResult> ToggleHostname(string id)
    {
        var host = await db.BcnHostnames.FindAsync(id);
        if (host == null)
            return NotFound(ApiResponse.Fail(BcnErrorCodes.HostnameNotFound));
        
        host.Status = host.Status == BcnHostnameStatus.Disabled
            ? BcnHostnameStatus.Active
            : BcnHostnameStatus.Disabled;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(host));
    }
    
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshHostnames([FromServices] BcnProbeQueue probeQueue)
    {
        await probeQueue.EnqueueAsync();
        return Ok(ApiResponse.Ok());
    }
    
    private static BcnProviderConfig DeserializeConfig(string? json) =>
        string.IsNullOrWhiteSpace(json)
            ? new BcnProviderConfig()
            : JsonSerializer.Deserialize<BcnProviderConfig>(json, BcnProviderConfig.SerializerOptions) ?? new BcnProviderConfig();
    
    private string? ValidateConfig(string providerId, BcnProviderConfig config)
    {
        if (!registry.Contains(providerId))
        {
            return config.Kind switch
            {
                BcnProviderKind.Get when string.IsNullOrWhiteSpace(config.UrlTemplate) => "urlTemplate",
                BcnProviderKind.Get when config.AuthType == "basic" &&
                                         (string.IsNullOrWhiteSpace(config.User) ||
                                          string.IsNullOrWhiteSpace(config.Password)) => "user",
                BcnProviderKind.Rest when string.IsNullOrWhiteSpace(config.EndpointTemplate) => "endpointTemplate",
                BcnProviderKind.Rest when config.EndpointTemplate?.Contains("{recordId}") == true &&
                                          string.IsNullOrWhiteSpace(config.RecordLookupTemplate) =>
                    "recordLookupTemplate",
                _ => null,
            };
        }

        return (from field in registry.Get(providerId).Info.CredentialFields
            where field.Required && string.IsNullOrWhiteSpace(GetConfigValue(config, field.Key))
            select field.Key).FirstOrDefault();
    }

    private static string? GetConfigValue(BcnProviderConfig config, string key) => key switch
    {
        "token" => config.Token,
        "username" => config.User,
        "password" => config.Password,
        "apiToken" => config.ApiToken,
        "apiKey" => config.ApiKey,
        "apiSecret" => config.ApiSecret,
        "zone" => config.Zone,
        _ => null,
    };
}

public record CreateHostnameRequest(
    string Hostname,
    string ProviderId,
    string Kind,
    string? ConfigJson
);

public record TestProviderRequest(
    string Hostname,
    string ProviderId,
    string Kind,
    string? ConfigJson
);

public record UpdateSettingsRequest(
    int CheckIntervalMinutes,
    int HeartbeatIntervalHours,
    string IpDetectionService,
    bool UpdateIpv6
);