using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Server.Constants;
using Namorix.Server.Models;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Controllers.Frontgate;
[ApiController]
[RequireAdmin]
[Route("api/frontgate/access-policies")]
public class AccessPolicyController(AppDbContext db, FrontgateProxyConfigProvider proxyProvider) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List() =>
        Ok(ApiResponse.Ok(await db.FgAccessPolicies.OrderByDescending(p => p.CreatedAt).ToListAsync()));

    [HttpPost]
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
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok(policy));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] CreateAccessPolicyRequest request)
    {
        var policy = await db.FgAccessPolicies.FindAsync(id);
        if (policy is null)
            return NotFound(ApiResponse.Fail(FgErrorCodes.PolicyNotFound));

        var rulesJson = request.Type == AccessPolicyType.BasicAuth
            ? HashBasicAuthPassword(request.RulesJson)
            : request.RulesJson;

        policy.Name = request.Name;
        policy.Type = request.Type;
        policy.RulesJson = rulesJson;
        
        await db.SaveChangesAsync();
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok(policy));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var hasRef = await db.FgReverseProxyRules.AnyAsync(r => r.AccessPolicyId == id);
        if (hasRef)
            return BadRequest(ApiResponse.Fail(FgErrorCodes.PolicyInUse));
        
        await db.FgAccessPolicies
            .Where(p => p.Id == id)
            .ExecuteDeleteAsync();
        await proxyProvider.UpdateAsync();
        return Ok(ApiResponse.Ok());
    }
    
    private static string HashBasicAuthPassword(string rulesJson)
    {
        using var doc = JsonDocument.Parse(rulesJson);
        var root = doc.RootElement;
        if (!root.TryGetProperty("username", out var u) || !root.TryGetProperty("password", out var p))
            return rulesJson;

        var password = p.GetString() ?? "";
        if (password.StartsWith("$2a$") || password.StartsWith("$2b$") || password.StartsWith("$2y$"))
            return rulesJson;

        return JsonSerializer.Serialize(new FgBasicAuthPolicy(
            u.GetString() ?? "", BCrypt.Net.BCrypt.HashPassword(password)));
    }
}


public record CreateAccessPolicyRequest(string Name, AccessPolicyType Type, string RulesJson);
