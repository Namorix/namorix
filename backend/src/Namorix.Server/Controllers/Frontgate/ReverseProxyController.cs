using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;
using Namorix.Server.Validation.Frontgate;

namespace Namorix.Server.Controllers.Frontgate;

[ApiController]
[RequireAdmin]
[Route("api/frontgate/reverse-proxy")]
public class ReverseProxyController(AppDbContext db, AcmeCertQueue certQueue,
    FrontgateAccessService accessService, IFrontgateNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListRules([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var query = db.FgReverseProxyRules
            .Include(r => r.Locations)
            .OrderByDescending(r => r.CreatedAt);
        
        var total = await query.CountAsync();
        var items = await query
            .Select(r => new
            {
                r.Id,
                r.Source,
                r.DestinationScheme,
                r.DestinationHost,
                r.DestinationPort,
                r.Access,
                r.Status,
                r.CreatedAt,
                r.ForceSsl,
                r.AccessPolicyId,
                r.CertificateId,
                r.AdditionalHeadersJson,
                r.WebSocketsSupport,
                r.CacheAssets,
                r.Http2Support,
                r.HstsEnabled,
                r.HstsSubdomains,
                r.TrustForwardedProtoHeaders,
                r.BlockCommonExploits,
                r.DryRunExpiresAt,
                r.RateLimit,
                r.RateLimitWindowSec,
                r.IsHealthy,
                r.LastHealthCheckAt,
                CertStatus = r.CertificateId != null
                    ? db.FgCertificates.Where(c => c.Id == r.CertificateId).Select(c => 
                        (string?)c.Status.ToString().ToLower()).FirstOrDefault()
                    : null,
                Locations = r.Locations!.Select(l => new
                {
                    l.Path,
                    l.Scheme,
                    l.ForwardHost,
                    l.ForwardPort
                })
            })
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();
        
        return Ok(ApiResponse.Ok(new { items, total }));
    }
    
    [HttpPost]
    [Validate(typeof(FrontgateRuleSchema))]
    public async Task<IActionResult> CreateRule(
        [FromBody] CreateRuleRequest request,
        [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var existing = await db.FgReverseProxyRules.AnyAsync(r => r.Source == request.Source);
        if (existing)
            return Conflict(ApiResponse.Fail(FgErrorCodes.DuplicateSourceError));

        var effectiveStatus = EffectiveStatus(request.DryRun, request.Status);
        var policyError = await ValidatePolicyAsync(request.AccessPolicyId, request.Access, effectiveStatus);
        if (policyError is not null)
            return policyError;
        
        FgCertificate? cert = null;
        if (request.RequestCert)
        {
            var certExists = await db.FgCertificates
                .Where(c => c.Status == FgCertificateStatus.Pending || c.Status == FgCertificateStatus.Active)
                .AnyAsync(c => c.CertificateDomains.Any(d => d.Domain == request.Source));

            if (certExists)
                return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateAlreadyExists));

            cert = new FgCertificate
            {
                CertificateDomains = [new FgCertificateDomain { Domain = request.Source }],
                Type = CertificateType.Ecdsa,
                Source = FgCertificateSource.LetsEncryptHttp,
                Status = FgCertificateStatus.Pending,
                AutoRenew = true,
            };
            
            db.FgCertificates.Add(cert);
            request = request with { CertificateId = cert.Id };
        }
        
        var rule = new FgReverseProxyRule
        {
            Source = request.Source,
            DestinationScheme = request.DestinationScheme,
            DestinationHost = request.DestinationHost,
            DestinationPort = request.DestinationPort,
            Access = Enum.Parse<ProxyAccessMode>(request.Access, ignoreCase: true),
            Status = Enum.Parse<ProxyRuleStatus>(effectiveStatus, ignoreCase: true),
            AccessPolicyId = request.AccessPolicyId,
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
            RateLimit = request.RateLimit,
            RateLimitWindowSec = request.RateLimitWindowSec
        };
        
        if (request.DryRun)
            rule.DryRunExpiresAt = DateTime.UtcNow.AddSeconds(ResolveDryRunSeconds(request.DryRunMinutes));
        
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
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Rule,
            rule.Id, rule.Source, FgAuditAction.Created,
            after: JsonSerializer.Serialize(rule, FrontgateAudit.JsonOptions));

        if (request.RequestCert && cert is not null)
            await certQueue.EnqueueAsync(cert.Id);

        await proxyProvider.UpdateAsync();
        await notifier.NotifyRuleChanged(rule.Id, FgRuleAction.Created);
        return Ok(ApiResponse.Ok(rule));
    }
    
    [HttpPut("{id}")]
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
            return NotFound(ApiResponse.Fail(FgErrorCodes.RuleNotFound));

        if (request.Source != rule.Source)
        {
            var existing = await db.FgReverseProxyRules.AnyAsync(r => r.Source == request.Source);
            if (existing)
                return Conflict(ApiResponse.Fail(FgErrorCodes.DuplicateSourceError));
        }
        
        var auditBefore = JsonSerializer.Serialize(rule, FrontgateAudit.JsonOptions);
        var effectiveStatus = EffectiveStatus(request.DryRun, request.Status);
        var policyError = await ValidatePolicyAsync(request.AccessPolicyId, request.Access, effectiveStatus);
        if (policyError is not null)
            return policyError;

        var newAccess = Enum.Parse<ProxyAccessMode>(request.Access, ignoreCase: true);
        var newStatus = Enum.Parse<ProxyRuleStatus>(effectiveStatus, ignoreCase: true);
        var newLocations = request.Locations?.Select(loc => new FgReverseProxyLocation
        {
            RuleId = rule.Id,
            Path = loc.Path,
            Scheme = loc.Scheme,
            ForwardHost = loc.ForwardHost,
            ForwardPort = loc.ForwardPort,
        }).ToList() ?? [];

        var changed = request.RequestCert
            || request.DryRun
            || request.Source != rule.Source
            || request.DestinationScheme != rule.DestinationScheme
            || request.DestinationHost != rule.DestinationHost
            || request.DestinationPort != rule.DestinationPort
            || request.AccessPolicyId != rule.AccessPolicyId
            || request.CertificateId != rule.CertificateId
            || newAccess != rule.Access
            || newStatus != rule.Status
            || request.WebSocketsSupport != rule.WebSocketsSupport
            || request.CacheAssets != rule.CacheAssets
            || request.ForceSsl != rule.ForceSsl
            || request.Http2Support != rule.Http2Support
            || request.HstsEnabled != rule.HstsEnabled
            || request.HstsSubdomains != rule.HstsSubdomains
            || request.TrustForwardedProtoHeaders != rule.TrustForwardedProtoHeaders
            || request.BlockCommonExploits != rule.BlockCommonExploits
            || request.AdditionalHeadersJson != rule.AdditionalHeadersJson
            || request.RateLimit != rule.RateLimit
            || request.RateLimitWindowSec != rule.RateLimitWindowSec
            || !LocationsEqual(rule.Locations, newLocations);

        if (!changed)
            return Ok(ApiResponse.Ok(rule));

        FgCertificate? newCertForUpdate = null;
        if (request.RequestCert)
        {
            var certExists = await db.FgCertificates
                .Where(c => c.Status == FgCertificateStatus.Pending || c.Status == FgCertificateStatus.Active)
                .AnyAsync(c => c.CertificateDomains.Any(d => d.Domain == request.Source));
            if (certExists)
                return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateAlreadyExists));

            newCertForUpdate = new FgCertificate
            {
                CertificateDomains = [new FgCertificateDomain { Domain = request.Source }],
                Type = CertificateType.Ecdsa,
                Source = FgCertificateSource.LetsEncryptHttp,
                Status = FgCertificateStatus.Pending,
                AutoRenew = true,
            };
            db.FgCertificates.Add(newCertForUpdate);
        }
        
        if (request.DryRun)
        {
            rule.DryRunSnapshotJson ??= JsonSerializer.Serialize(FgRuleSnapshot.From(rule));
            rule.DryRunExpiresAt = DateTime.UtcNow.AddSeconds(ResolveDryRunSeconds(request.DryRunMinutes));
        }
        
        if (request.DestinationScheme != rule.DestinationScheme
            || request.DestinationHost != rule.DestinationHost
            || request.DestinationPort != rule.DestinationPort)
        {
            rule.IsHealthy = null;
            rule.LastHealthCheckAt = null;
        }

        rule.Source = request.Source;
        rule.DestinationScheme = request.DestinationScheme;
        rule.DestinationHost = request.DestinationHost;
        rule.DestinationPort = request.DestinationPort;
        rule.AccessPolicyId = request.AccessPolicyId;
        rule.CertificateId = newCertForUpdate?.Id ?? request.CertificateId;
        rule.Access = newAccess;
        rule.Status = newStatus;
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
        rule.Locations = newLocations;
        rule.RateLimit = request.RateLimit;
        rule.RateLimitWindowSec = request.RateLimitWindowSec;
        
        var auditAfter = JsonSerializer.Serialize(rule, FrontgateAudit.JsonOptions);
        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Rule,
            id, rule.Source, FgAuditAction.Updated, before: auditBefore, after: auditAfter);
        
        if (newCertForUpdate != null)
            await certQueue.EnqueueAsync(newCertForUpdate.Id);
        
        await proxyProvider.UpdateAsync();
        await notifier.NotifyRuleChanged(id, FgRuleAction.Updated);
        return Ok(ApiResponse.Ok(rule));
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRule(
        string id,
        [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var rule = await db.FgReverseProxyRules.FindAsync(id);
        if (rule == null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.RuleNotFound));
        
        db.FgReverseProxyRules.Remove(rule);
        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Rule,
            id, rule.Source, FgAuditAction.Deleted,
            before: JsonSerializer.Serialize(rule, FrontgateAudit.JsonOptions));
        await proxyProvider.UpdateAsync();
        await notifier.NotifyRuleChanged(id, FgRuleAction.Deleted);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpPost("{id}/dry-run/confirm")]
    public async Task<IActionResult> ConfirmDryRun(string id)
    {
        var rule = await db.FgReverseProxyRules.FindAsync(id);
        if (rule is null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.RuleNotFound));
        
        if (rule.DryRunExpiresAt is null)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.DryRunNotPending));
        
        rule.DryRunExpiresAt = null;
        rule.DryRunSnapshotJson = null;
        
        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Rule,
            id, rule.Source, FgAuditAction.DryRunConfirm);
        await notifier.NotifyDryRunChanged(id, FgDryRunAction.Confirm);
        return Ok(ApiResponse.Ok());
    }

    [HttpPost("{id}/dry-run/cancel")]
    public async Task<IActionResult> CancelDryRun(string id, [FromServices] FrontgateProxyConfigProvider proxyProvider)
    {
        var rule = await db.FgReverseProxyRules.Include(r => r.Locations).FirstOrDefaultAsync(r => r.Id == id);
        if (rule is null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.RuleNotFound));
        
        if (rule.DryRunExpiresAt is null)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.DryRunNotPending));
        
        if (!string.IsNullOrEmpty(rule.DryRunSnapshotJson))
        {
            JsonSerializer.Deserialize<FgRuleSnapshot>(rule.DryRunSnapshotJson)?.ApplyTo(rule);
            rule.DryRunExpiresAt = null;
            rule.DryRunSnapshotJson = null;
        }
        else
        {
            db.FgReverseProxyRules.Remove(rule);   // Locations cascade delete
        }
        
        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Rule,
            id, rule.Source, FgAuditAction.DryRunCancel);
        await proxyProvider.UpdateAsync();
        await notifier.NotifyDryRunChanged(id, FgDryRunAction.Cancel);
        return Ok(ApiResponse.Ok());
    }
    
    private async Task<IActionResult?> ValidatePolicyAsync(string? policyId, string access, string status)
    {
        if (string.IsNullOrEmpty(policyId))
        {
            var mode = Enum.Parse<ProxyAccessMode>(access, ignoreCase: true);
            return mode is ProxyAccessMode.Restricted or ProxyAccessMode.BasicAuth ?
                BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyRequired)) : null;
        }
        
        var policy = await db.FgAccessPolicies.FindAsync(policyId);
        if (policy is null)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyNotFound));
    

        var parsed = Enum.Parse<ProxyAccessMode>(access, ignoreCase: true);
        var isActive = Enum.TryParse<ProxyRuleStatus>(status, ignoreCase: true, out var s) && s == ProxyRuleStatus.Active;
        if (isActive && parsed != ProxyAccessMode.BasicAuth &&
            accessService.Evaluate(parsed, policy, GetAdminIp(), null) == AccessDecision.Deny)
        {
            return BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyLocksOutAdmin));
        }

        return !IsModePolicyCompatible(parsed, policy.Type) ?
            BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyTypeMismatch)) : null;
    }
    
    private static bool IsModePolicyCompatible(ProxyAccessMode mode, AccessPolicyType type) => mode switch
    {
        ProxyAccessMode.Restricted => type is AccessPolicyType.IpAllowlist
            or AccessPolicyType.IpDenylist or AccessPolicyType.GeoBlock,
        ProxyAccessMode.BasicAuth => type == AccessPolicyType.BasicAuth,
        _ => true, // Public/Private not use policy
    };
    
    private IPAddress GetAdminIp()
    {
        if (HttpContext.Items.TryGetValue(HttpContextKeys.RealIp, out var raw) &&
            raw is string s && IPAddress.TryParse(s, out var realIp))
            return realIp;
        return HttpContext.Connection.RemoteIpAddress!;
    }
    
    private static string EffectiveStatus(bool dryRun, string status) => dryRun ? "active" : status;
    
    private static int ResolveDryRunSeconds(int minutes) =>
        minutes is 1 or 5 or 10 ? minutes * 60 : 60;

    private static bool LocationsEqual(
        ICollection<FgReverseProxyLocation>? a,
        ICollection<FgReverseProxyLocation>? b)
    {
        if (ReferenceEquals(a, b)) return true;
        if (a is null || b is null) return false;
        if (a.Count != b.Count) return false;
        using var ia = a.GetEnumerator();
        using var ib = b.GetEnumerator();
        while (ia.MoveNext() && ib.MoveNext())
        {
            var x = ia.Current;
            var y = ib.Current;
            if (x.Path != y.Path || x.Scheme != y.Scheme ||
                x.ForwardHost != y.ForwardHost || x.ForwardPort != y.ForwardPort)
                return false;
        }
        return true;
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
    string? AccessPolicyId,
    bool WebSocketsSupport,
    bool CacheAssets,
    bool ForceSsl,
    bool Http2Support,
    bool HstsEnabled,
    bool HstsSubdomains,
    bool TrustForwardedProtoHeaders,
    bool BlockCommonExploits,
    string? AdditionalHeadersJson,
    List<LocationRequest>? Locations,
    bool RequestCert = false,
    bool DryRun = false,
    int DryRunMinutes = 1,
    int? RateLimit = null,
    int? RateLimitWindowSec = null
);

public record LocationRequest(
    string Path,
    string Scheme,
    string ForwardHost,
    int ForwardPort
);