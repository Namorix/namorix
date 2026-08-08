using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.IO;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;
using Namorix.Server.Validation;

namespace Namorix.Server.Controllers.Frontgate;

[ApiController]
[RequireAdmin]
[Route("api/frontgate/certificates")]
public class CertificateController(AppDbContext db, DataDirectory dataDir, AcmeCertQueue certQueue,
    DnsLookupChecker dnsLookupChecker, AcmeDryRunService acmeDryRunService, IFrontgateNotifier notifier) : ControllerBase
{
    [HttpGet]
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

    [HttpGet("all")]
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
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCertificate(string id)
    {
        var cert = await db.FgCertificates
            .Include(c => c.CertificateDomains)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (cert == null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.CertificateNotFound));

        var primaryDomain = cert.CertificateDomains.FirstOrDefault()?.Domain;
        if (primaryDomain != null)
        {
            var name = primaryDomain.Replace('*', '_');
            var certDir = Path.Combine(DataDirectory.CertDir, name);
            dataDir.DeleteFile(Path.Combine(certDir, DataDirectory.PrivateKeyFile));
            dataDir.DeleteFile(Path.Combine(certDir, DataDirectory.FullChainFile));
        }

        db.FgCertificates.Remove(cert);
        await db.SaveChangesAsync();
        await notifier.NotifyCertChanged(cert.Id, FgCertAction.Deleted);
        return Ok(ApiResponse.Ok());

    }
    
    [HttpPost("{id}/retry")]
    public async Task<IActionResult> RetryCertificate(string id)
    {
        var cert = await db.FgCertificates.FindAsync(id);
        if (cert == null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.CertificateNotFound));

        if (cert.Status != FgCertificateStatus.Error)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateNotRetriable));

        await db.FgCertificates
            .Where(c => c.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Status, FgCertificateStatus.Pending));

        await certQueue.EnqueueAsync(id);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpPost("{id}/renew")]
    public async Task<IActionResult> RenewCertificate(string id)
    {
        var cert = await db.FgCertificates.FindAsync(id);
        if (cert == null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.CertificateNotFound));

        if (cert.Status != FgCertificateStatus.Active)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateNotRetriable));

        await db.FgCertificates
            .Where(c => c.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Status, FgCertificateStatus.Pending));

        await certQueue.EnqueueAsync(id);
        return Ok(ApiResponse.Ok());
    }
    
    [HttpPost("letsencrypt-http")]
    [Validate(typeof(FrontgateCertSchema))]
    public async Task<IActionResult> CreateLetsEncryptCert(
        [FromBody] CreateLetsEncryptCertRequest request)
    {
        if (request.Domains.Count == 0)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateDomainsRequired));

        var primary = request.Domains.First();
        var exists = await db.FgCertificates
            .Where(c => c.Status == FgCertificateStatus.Pending || c.Status == FgCertificateStatus.Active)
            .AnyAsync(c => c.CertificateDomains.Any(d => d.Domain == primary));
        if (exists)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateAlreadyExists));
        
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
        await notifier.NotifyCertChanged(cert.Id, FgCertAction.Created);
        await certQueue.EnqueueAsync(cert.Id);
        return Ok(ApiResponse.Ok(cert));
    }
    
    [HttpPost("letsencrypt-http/dry-run")]
    [Validate(typeof(FrontgateCertSchema))]
    public async Task<IActionResult> TestLetsEncryptHttp(
        [FromBody] CreateLetsEncryptDryRunRequest request,
        CancellationToken ct)
    {
        var warnings = await dnsLookupChecker.CheckAsync(request.Domains, ct);
        var result = await acmeDryRunService.RunAsync(request.Domains, ct);
        return Ok(ApiResponse.Ok(new
        {
            passed = result.Passed,
            message = result.Message,
            warnings
        }));
    }
    
    [HttpPost("custom")]
    public async Task<IActionResult> CreateCustomCert(
        [FromBody] CreateCustomCertRequest request)
    {
        const int maxSize = 64 * 1024; // 64KB
        
        // Size limit (DoS protection)
        if (request.CertificateKey.Length > maxSize)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateKeyToLarge));
        
        if (request.Certificate.Length > maxSize)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateTooLarge));
        
        if (request.Intermediate?.Length > maxSize)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.CertificateIntermediateTooLarge));

        // Parse + validate PEM: keypair match, passphrase, format
        X509Certificate2 parsedCert;
        try
        {
            parsedCert = X509Certificate2.CreateFromPem(request.Certificate, request.CertificateKey);
        }
        catch (CryptographicException)
        {
            return BadRequest(ApiResponse.Fail(FgErrorCodes.InvalidCertificate));
        }
        
        var name = request.Name;
        var certContent = string.IsNullOrEmpty(request.Intermediate)
            ? request.Certificate
            : $"{request.Certificate}\n{request.Intermediate}";
        
        var certDir = Path.Combine(DataDirectory.CertDir, name);
        dataDir.WriteFile(Path.Combine(certDir, DataDirectory.PrivateKeyFile), Encoding.UTF8.GetBytes(request.CertificateKey));
        dataDir.WriteFile(Path.Combine(certDir, DataDirectory.FullChainFile), Encoding.UTF8.GetBytes(certContent));
        
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
        await notifier.NotifyCertChanged(cert.Id, FgCertAction.Created);
        return Ok(ApiResponse.Ok(cert));
    }
    
    [HttpGet("unused-domains")]
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
}

public record CreateLetsEncryptCertRequest(
    List<string> Domains,
    string KeyType,
    bool AutoRenew
);

public record CreateCustomCertRequest(
    string Name,
    string CertificateKey,
    string Certificate,
    string? Intermediate
);

public record CreateLetsEncryptDryRunRequest(
    List<string> Domains
);