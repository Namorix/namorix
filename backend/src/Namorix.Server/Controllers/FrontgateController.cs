using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Server.Models;
using Namorix.Server.Persistence;
using Namorix.Server.Services;
using Namorix.Server.Validation;

namespace Namorix.Server.Controllers;

[ApiController]
[RequireAdmin]
[Route("api/frontgate")]
public class FrontgateController(AppDbContext db) : ControllerBase
{
    private const string RuleNotFound = "RULE_NOT_FOUND";
    private const string DuplicateSourceError = "DUPLICATE_SOURCE";
    
    [HttpGet("reverse-proxy")]
    public async Task<IActionResult> ListRules([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var query = db.FgReverseProxyRules
            .Include(r => r.Locations)
            .OrderByDescending(r => r.CreatedAt);
        
        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();
        
        return Ok(ApiResponse.Ok(new { items, total }));
    }
    
    [HttpPost("reverse-proxy")]
    [Validate(typeof(FrontgateRuleSchema))]
    public async Task<IActionResult> CreateRule(
        [FromBody] CreateRuleRequest request,
        [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var existing = await db.FgReverseProxyRules.AnyAsync(r => r.Source == request.Source);
        if (existing)
            return Conflict(ApiResponse.Fail(DuplicateSourceError));

        var rule = new FgReverseProxyRule
        {
            Source = request.Source,
            DestinationScheme = request.DestinationScheme,
            DestinationHost = request.DestinationHost,
            DestinationPort = request.DestinationPort,
            Access = Enum.Parse<ProxyAccessMode>(request.Access, ignoreCase: true),
            Status = Enum.Parse<ProxyRuleStatus>(request.Status, ignoreCase: true),
            CertificateId = request.CertificateId,
            WebSocketsSupport = request.WebSocketsSupport,
            CacheAssets = request.CacheAssets,
            ForceSsl = request.ForceSsl,
            Http2Support = request.Http2Support,
            HstsEnabled = request.HstsEnabled,
            HstsSubdomains = request.HstsSubdomains,
            TrustForwardedProtoHeaders = request.TrustForwardedProtoHeaders,
            BlockCommonExploits = request.BlockCommonExploits,
            AdditionalHeadersJson = request.AdditionalHeadersJson,
        };
        
        if (request.Locations is { Count: > 0 })
        {
            rule.Locations =
            [
                .. request.Locations.Select(loc => new FgReverseProxyLocation
                {
                    RuleId = rule.Id,
                    Path = loc.Path,
                    Scheme = loc.Scheme,
                    ForwardHost = loc.ForwardHost,
                    ForwardPort = loc.ForwardPort,
                })
            ];
        }

        
        db.FgReverseProxyRules.Add(rule);
        await db.SaveChangesAsync();
        await proxyProvider.UpdateAsync();
        
        return Ok(ApiResponse.Ok(rule));
    }
    
    [HttpPut("reverse-proxy/{id}")]
    [Validate(typeof(FrontgateRuleSchema))]
    public async Task<IActionResult> UpdateRule(
        string id,
        [FromBody] CreateRuleRequest request,
        [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var rule = await db.FgReverseProxyRules
            .Include(r => r.Locations)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (rule == null)
            return NotFound(ApiResponse.Fail(RuleNotFound));

        if (request.Source != rule.Source)
        {
            var existing = await db.FgReverseProxyRules.AnyAsync(r => r.Source == request.Source);
            if (existing)
                return Conflict(ApiResponse.Fail(DuplicateSourceError));
        }

        rule.Source = request.Source;
        rule.DestinationScheme = request.DestinationScheme;
        rule.DestinationHost = request.DestinationHost;
        rule.DestinationPort = request.DestinationPort;
        rule.CertificateId = request.CertificateId;
        rule.Access = Enum.Parse<ProxyAccessMode>(request.Access, ignoreCase: true);
        rule.Status = Enum.Parse<ProxyRuleStatus>(request.Status, ignoreCase: true);
        rule.WebSocketsSupport = request.WebSocketsSupport;
        rule.CacheAssets = request.CacheAssets;
        rule.ForceSsl = request.ForceSsl;
        rule.Http2Support = request.Http2Support;
        rule.HstsEnabled = request.HstsEnabled;
        rule.HstsSubdomains = request.HstsSubdomains;
        rule.TrustForwardedProtoHeaders = request.TrustForwardedProtoHeaders;
        rule.BlockCommonExploits = request.BlockCommonExploits;
        rule.AdditionalHeadersJson = request.AdditionalHeadersJson;
        rule.UpdatedAt = DateTime.UtcNow;
        
        rule.Locations = request.Locations?.Select(loc => new FgReverseProxyLocation
        {
            RuleId = rule.Id,
            Path = loc.Path,
            Scheme = loc.Scheme,
            ForwardHost = loc.ForwardHost,
            ForwardPort = loc.ForwardPort,
        }).ToList() ?? [];
        
        await db.SaveChangesAsync();
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok(rule));
    }
    
    [HttpDelete("reverse-proxy/{id}")]
    public async Task<IActionResult> DeleteRule(
        string id,
        [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var rule = await db.FgReverseProxyRules.FindAsync(id);
        if (rule == null)
            return NotFound(ApiResponse.Fail(RuleNotFound));
        
        db.FgReverseProxyRules.Remove(rule);
        await db.SaveChangesAsync();
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok());
    }
    
    [HttpGet("certificates")]
    public async Task<IActionResult> ListCertificates()
    {
        var certs = await db.FgCertificates
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new {
                c.Id,
                c.Domain,
                c.Issuer,
                type = c.Type.ToString(),
                expiresAt = c.ExpiresAt,
            })
            .ToListAsync();
        return Ok(ApiResponse.Ok(certs));
    }
}

public record CreateRuleRequest(
    string Source,
    string DestinationScheme,
    string DestinationHost,
    int DestinationPort,
    string? CertificateId,
    string Access,
    string Status,
    bool WebSocketsSupport,
    bool CacheAssets,
    bool ForceSsl,
    bool Http2Support,
    bool HstsEnabled,
    bool HstsSubdomains,
    bool TrustForwardedProtoHeaders,
    bool BlockCommonExploits,
    string? AdditionalHeadersJson,
    List<LocationRequest>? Locations
);

public abstract record LocationRequest(
    string Path,
    string Scheme,
    string ForwardHost,
    int ForwardPort
);