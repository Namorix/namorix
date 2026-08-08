using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
[Route("api/frontgate/access-policies")]
public class AccessPolicyController(AppDbContext db, FrontgateProxyConfigProvider proxyProvider,
    IFrontgateNotifier notifier) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(ApiResponse.Ok(await db.FgAccessPolicies.OrderByDescending(p => p.CreatedAt).ToListAsync()));

    [HttpPost]
    [Validate(typeof(AccessPolicySchema))]
    public async Task<IActionResult> Create([FromBody] CreateAccessPolicyRequest request)
    {
        var rulesJson = request.Type == AccessPolicyType.BasicAuth
            ? HashBasicAuthPassword(request.RulesJson)
            : request.RulesJson;
        
        var policy = new FgAccessPolicy
        {
            Name = request.Name,
            Type = request.Type,
            RulesJson = rulesJson
        };
        
        db.FgAccessPolicies.Add(policy);
        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Policy,
            policy.Id, policy.Name, FgAuditAction.Created);
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok(policy));
    }

    [HttpPut("{id}")]
    [Validate(typeof(AccessPolicySchema))]
    public async Task<IActionResult> Update(string id, [FromBody] CreateAccessPolicyRequest request)
    {
        var policy = await db.FgAccessPolicies.FindAsync(id);
        if (policy is null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.PolicyNotFound));

        var rulesJson = request.Type == AccessPolicyType.BasicAuth
            ? HashBasicAuthPassword(request.RulesJson)
            : request.RulesJson;

        var changed = policy.Name != request.Name
            || policy.Type != request.Type
            || policy.RulesJson != rulesJson;
        
        if (!changed)
            return Ok(ApiResponse.Ok(policy));

        policy.Name = request.Name;
        policy.Type = request.Type;
        policy.RulesJson = rulesJson;

        await db.SaveChangesAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Policy,
            id, policy.Name, FgAuditAction.Updated);
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok(policy));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var hasRef = await db.FgReverseProxyRules.AnyAsync(r => r.AccessPolicyId == id);
        if (hasRef)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyInUse));

        var policyName = await db.FgAccessPolicies
            .Where(p => p.Id == id).Select(p => p.Name).FirstOrDefaultAsync();
        await db.FgAccessPolicies
            .Where(p => p.Id == id)
            .ExecuteDeleteAsync();
        await proxyProvider.UpdateAsync();
        await FrontgateAudit.LogAsync(db, notifier, FrontgateAudit.Who(HttpContext), FgAuditTargetType.Policy,
            id, policyName, FgAuditAction.Deleted);
        return Ok(ApiResponse.Ok());
    }
    
    private static string HashBasicAuthPassword(string rulesJson)
    {
        using var doc = JsonDocument.Parse(rulesJson);
        var root = doc.RootElement;
        if (!root.TryGetProperty("username", out var u) || !root.TryGetProperty("password", out var p))
            return rulesJson;
        
        var password = p.GetString() ?? "";
        if (string.IsNullOrEmpty(password) &&
            root.TryGetProperty("passwordHash", out var ph) &&
            ph.GetString() is { Length: > 0 } existingHash)
        {
            return JsonSerializer.Serialize(new FgBasicAuthPolicy(u.GetString() ?? "", existingHash),
                FrontgateAccessService.SerializerOptions);
        }
        
        if (password.StartsWith("$2a$") || password.StartsWith("$2b$") || password.StartsWith("$2y$"))
            return rulesJson;
        
        return JsonSerializer.Serialize(new FgBasicAuthPolicy(
                u.GetString() ?? "", BCrypt.Net.BCrypt.HashPassword(password)),
            FrontgateAccessService.SerializerOptions);
    }
}


public record CreateAccessPolicyRequest(string Name, AccessPolicyType Type, string RulesJson);
