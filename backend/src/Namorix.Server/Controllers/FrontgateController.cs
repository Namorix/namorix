using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.IO;
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
public class FrontgateController(AppDbContext db, DataDirectory dataDir) : ControllerBase
{
    private const string RuleNotFound = "RULE_NOT_FOUND";
    private const string CertificateNotFound = "CERTIFICATE_NOT_FOUND";
    private const string CertificateKeyToLarge = "CERTIFICATE_KEY_TOO_LARGE";
    private const string CertificateTooLarge = "CERTIFICATE_TOO_LARGE";
    private const string CertificateIntermediateTooLarge = "CERTIFICATE_INTERMEDIATE_TOO_LARGE";
    private const string DuplicateSourceError = "DUPLICATE_SOURCE";
    private const string InvalidCertificate = "INVALID_CERTIFICATE";
    
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
    
    [HttpGet("certificates/unused-domains")]
    public async Task<IActionResult> GetUnusedDomains()
    {
        var usedDomains = await db.FgCertificateDomains
            .Select(d => d.Domain)
            .ToListAsync();
    
        var unused = await db.FgReverseProxyRules
            .Where(r => r.CertificateId == null)
            .Select(r => r.Source)
            .Where(s => !usedDomains.Contains(s))
            .ToListAsync();
    
        return Ok(ApiResponse.Ok(unused));
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
    public async Task<IActionResult> ListCertificates(
        [FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var query = db.FgCertificates
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                domains = c.CertificateDomains.Select(d => d.Domain).ToList(),
                c.Issuer, c.Type,
                source = c.Source,
                status = c.Status,
                isInUse = c.ReverseProxyRules.Any(),
                createdAt = c.CreatedAt,
                expiresAt = c.ExpiresAt,
            });

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync();
        return Ok(ApiResponse.Ok(new { items, total }));
    }

    [HttpGet("certificates/all")]
    public async Task<IActionResult> GetAllCertificates()
    {
        var items = await db.FgCertificates
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                domains = c.CertificateDomains.Select(d => d.Domain).ToList(),
                c.Issuer, c.Type,
                source = c.Source,
                status = c.Status,
                isInUse = c.ReverseProxyRules.Any(),
                createdAt = c.CreatedAt,
                expiresAt = c.ExpiresAt,
            })
            .ToListAsync();

        return Ok(ApiResponse.Ok(new { items, total = items.Count }));
    }
    
    [HttpDelete("certificates/{id}")]
    public async Task<IActionResult> DeleteCertificate(string id)
    {
        var cert = await db.FgCertificates.FindAsync(id);
        if (cert == null)
            return NotFound(ApiResponse.Fail(CertificateNotFound));
    
        db.FgCertificates.Remove(cert);  // FK SetNull → rules apply, certId is cleared instead of deleting the related records
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok());
    }
    
    [HttpPost("certificates/letsencrypt-http")]
    public async Task<IActionResult> CreateLetsEncryptCert(
        [FromBody] CreateLetsEncryptCertRequest request)
    {
        // TODO: ACME HTTP-01 challenge via Certes
        var cert = new FgCertificate
        {
            CertificateDomains =
            [
                .. request.Domains.Select(d => new FgCertificateDomain
                {
                    Domain = d,
                })
            ],
            Type = Enum.Parse<CertificateType>(request.KeyType, ignoreCase: true),
            Source = FgCertificateSource.LetsEncryptHttp,
            Status = FgCertificateStatus.Pending,
            AutoRenew = request.AutoRenew,
        };
        
        db.FgCertificates.Add(cert);
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(cert));
    }

    [HttpPost("certificates/letsencrypt-dns")]
    public async Task<IActionResult> CreateLetsEncryptDnsCert(
        [FromBody] CreateLetsEncryptDnsCertRequest request)
    {
        var cert = new FgCertificate
        {
            CertificateDomains =
            [
                .. request.Domains.Select(d => new FgCertificateDomain
                {
                    Domain = d,
                })
            ],
            Type = Enum.Parse<CertificateType>(request.KeyType, ignoreCase: true),
            Source = FgCertificateSource.LetsEncryptDns,
            Status = FgCertificateStatus.Pending,
            DnsProviderId = request.DnsProviderId,
            AutoRenew = request.AutoRenew,
        };
        
        db.FgCertificates.Add(cert);
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(cert));
    }
    
    [HttpPost("certificates/custom")]
    public async Task<IActionResult> CreateCustomCert(
        [FromBody] CreateCustomCertRequest request)
    {
        const int maxSize = 64 * 1024; // 64KB
        
        // Size limit (DoS protection)
        if (request.CertificateKey.Length > maxSize)
            return BadRequest(ApiResponse.Fail(CertificateKeyToLarge));
        
        if (request.Certificate.Length > maxSize)
            return BadRequest(ApiResponse.Fail(CertificateTooLarge));
        
        if (request.Intermediate?.Length > maxSize)
            return BadRequest(ApiResponse.Fail(CertificateIntermediateTooLarge));

        // Parse + validate PEM: keypair match, passphrase, format
        X509Certificate2 parsedCert;
        try
        {
            parsedCert = X509Certificate2.CreateFromPem(request.Certificate, request.CertificateKey);
        }
        catch (CryptographicException)
        {
            return BadRequest(ApiResponse.Fail(InvalidCertificate));
        }
        
        var name = request.Name;
        var certContent = string.IsNullOrEmpty(request.Intermediate)
            ? request.Certificate
            : $"{request.Certificate}\n{request.Intermediate}";
        
        dataDir.WriteFile($"certs/{name}/privkey.pem", Encoding.UTF8.GetBytes(request.CertificateKey));
        dataDir.WriteFile($"certs/{name}/fullchain.pem", Encoding.UTF8.GetBytes(certContent));
        
        var cert = new FgCertificate
        {
            Source = FgCertificateSource.Custom,
            Status = FgCertificateStatus.Active,
            Type = parsedCert.GetRSAPrivateKey() != null ? CertificateType.Rsa : CertificateType.Ecdsa,
            Issuer = parsedCert.Issuer,
            ExpiresAt = parsedCert.NotAfter.ToUniversalTime(),
            CertificateDomains = new List<FgCertificateDomain>
            {
                new() { Domain = name }
            },
        };
        
        db.FgCertificates.Add(cert);
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok(cert));
    }

    [HttpGet("dns-providers")]
    public IActionResult ListDnsProviders()
    {
        var ids = DnsProviders.All.Select(p => p.Id).ToList();
        return Ok(ApiResponse.Ok(ids));
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

public record CreateLetsEncryptCertRequest(
    List<string> Domains,
    string KeyType,
    bool AutoRenew
);
public record CreateLetsEncryptDnsCertRequest(
    List<string> Domains,
    string KeyType,
    string DnsProviderId,
    bool AutoRenew

);
public record CreateCustomCertRequest(
    string Name,
    string CertificateKey,
    string Certificate,
    string? Intermediate
);