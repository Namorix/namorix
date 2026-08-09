using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Middleware;
using Namorix.Core.Responses;
using Namorix.Core.Validation;
using Namorix.Server.Constants;
using Namorix.Server.Models.Warden;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Warden;
using Namorix.Server.Validation.Warden;

namespace Namorix.Server.Controllers.Warden;

[ApiController]
[RequireAdmin]
[Route("api/warden")]
public class WdController(AppDbContext db, WdFirewallService firewall) : ControllerBase
{
    [HttpGet("rules")]
    public async Task<IActionResult> ListRules()
    {
        var rules = await db.WdFirewallRules
            .OrderBy(r => r.Priority ?? int.MaxValue)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Ok(ApiResponse.Ok(rules));
    }

    [HttpPost("rules")]
    [Validate(typeof(WdRuleSchema))]
    public async Task<IActionResult> CreateRule([FromBody] WdRuleRequest req)
    {
        if (!IsValidCidr(req.SourceCidr, out var cidrError))
            return BadRequest(ApiResponse.Fail(WdErrorCodes.InvalidCidr, cidrError));
        if (!IsValidPorts(req.Ports, out var portsError))
            return BadRequest(ApiResponse.Fail(WdErrorCodes.InvalidPorts, portsError));

        var rule = new WdFirewallRule
        {
            Name = req.Name,
            SourceCidr = string.IsNullOrWhiteSpace(req.SourceCidr) ? null : req.SourceCidr.Trim(),
            Ports = string.IsNullOrWhiteSpace(req.Ports) ? null : req.Ports.Trim(),
            Protocol = req.Protocol,
            Action = req.Action,
            Enabled = req.Enabled,
            Priority = req.Priority,
        };

        db.WdFirewallRules.Add(rule);
        await db.SaveChangesAsync();

        if (!await firewall.ApplyRuleAsync(rule))
        {
            db.WdFirewallRules.Remove(rule);
            await db.SaveChangesAsync();
            return Ok(ApiResponse.Fail(WdErrorCodes.EnforcementFailed,
                "Rule saved but could not be enforced — check NET_ADMIN/iptables on the namorix container"));
        }

        return Ok(ApiResponse.Ok(rule));
    }

    [HttpPut("rules/{id:int}")]
    [Validate(typeof(WdRuleSchema))]
    public async Task<IActionResult> UpdateRule(int id, [FromBody] WdRuleRequest req)
    {
        var rule = await db.WdFirewallRules.FindAsync(id);
        if (rule is null)
            return NotFound(ApiResponse.Fail(WdErrorCodes.RuleNotFound));

        if (!IsValidCidr(req.SourceCidr, out var cidrError))
            return BadRequest(ApiResponse.Fail(WdErrorCodes.InvalidCidr, cidrError));
        if (!IsValidPorts(req.Ports, out var portsError))
            return BadRequest(ApiResponse.Fail(WdErrorCodes.InvalidPorts, portsError));

        // Snapshot before mutating so we can revert if enforcement fails
        var snapshot = new
        {
            rule.Name, rule.SourceCidr, rule.Ports, rule.Protocol,
            rule.Action, rule.Enabled, rule.Priority
        };

        rule.Name = req.Name;
        rule.SourceCidr = string.IsNullOrWhiteSpace(req.SourceCidr) ? null : req.SourceCidr.Trim();
        rule.Ports = string.IsNullOrWhiteSpace(req.Ports) ? null : req.Ports.Trim();
        rule.Protocol = req.Protocol;
        rule.Action = req.Action;
        rule.Enabled = req.Enabled;
        rule.Priority = req.Priority;

        await db.SaveChangesAsync();

        if (!await firewall.ApplyRuleAsync(rule))
        {
            rule.Name = snapshot.Name;
            rule.SourceCidr = snapshot.SourceCidr;
            rule.Ports = snapshot.Ports;
            rule.Protocol = snapshot.Protocol;
            rule.Action = snapshot.Action;
            rule.Enabled = snapshot.Enabled;
            rule.Priority = snapshot.Priority;
            await db.SaveChangesAsync();
            return Ok(ApiResponse.Fail(WdErrorCodes.EnforcementFailed,
                "Rule update could not be enforced — changes reverted"));
        }

        return Ok(ApiResponse.Ok(rule));
    }

    [HttpDelete("rules/{id:int}")]
    public async Task<IActionResult> DeleteRule(int id)
    {
        var rule = await db.WdFirewallRules.FindAsync(id);
        if (rule is null)
            return NotFound(ApiResponse.Fail(WdErrorCodes.RuleNotFound));

        db.WdFirewallRules.Remove(rule);
        await db.SaveChangesAsync();
        await firewall.RemoveRuleAsync(rule);
        return Ok(ApiResponse.Ok(new { deleted = true }));
    }

    [HttpPost("rules/{id:int}/toggle")]
    public async Task<IActionResult> ToggleRule(int id)
    {
        var rule = await db.WdFirewallRules.FindAsync(id);
        if (rule is null)
            return NotFound(ApiResponse.Fail(WdErrorCodes.RuleNotFound));

        rule.Enabled = !rule.Enabled;
        await db.SaveChangesAsync();

        var applied = rule.Enabled
            ? await firewall.ApplyRuleAsync(rule)
            : await firewall.RemoveRuleAsync(rule);
        if (!applied)
        {
            rule.Enabled = !rule.Enabled; // revert
            await db.SaveChangesAsync();
            return Ok(ApiResponse.Fail(WdErrorCodes.EnforcementFailed,
                "Rule toggle could not be enforced — reverted"));
        }

        return Ok(ApiResponse.Ok(rule));
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings() =>
        Ok(ApiResponse.Ok(await GetOrCreateSettingsAsync()));

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] WdSettingsRequest req)
    {
        var settings = await GetOrCreateSettingsAsync();
        settings.FirewallEnabled = req.FirewallEnabled;
        settings.Profile = req.Profile;
        settings.CustomThresholdFactor = req.CustomThresholdFactor ?? settings.CustomThresholdFactor;
        settings.CustomDurationFactor = req.CustomDurationFactor ?? settings.CustomDurationFactor;
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var enabled = await db.WdFirewallRules.Where(r => r.Enabled).ToListAsync();
        if (req.FirewallEnabled)
            await firewall.ApplyAllAsync(enabled);
        else
            foreach (var rule in enabled)
                await firewall.RemoveRuleAsync(rule);

        return Ok(ApiResponse.Ok(settings));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var activeRules = await db.WdFirewallRules
            .CountAsync(r => r.Enabled && (r.ExpiresAt == null || r.ExpiresAt > now));
        var blockedToday = await db.WdFirewallRules
            .CountAsync(r => r.Auto && r.CreatedAt >= now.Date);   // Today's events
        var totalEvents = await db.WdSecurityEvents.CountAsync(); 
        var openPorts = await OpenPortsAsync();
        return Ok(ApiResponse.Ok(new
        {
            activeRules,
            blockedToday,
            totalEvents,
            openPorts
        }));
    }

    private async Task<WdSettings> GetOrCreateSettingsAsync()
    {
        var settings = await db.WdSettings.FirstOrDefaultAsync();
        if (settings is not null)
            return settings;
        
        settings = new WdSettings { Id = 1 };
        db.WdSettings.Add(settings);
        await db.SaveChangesAsync();
        return settings;
    }

    private async Task<int> OpenPortsAsync()
    {
        var allowPorts = await db.WdFirewallRules
            .Where(r => r.Enabled && r.Action == WdRuleAction.Allow && r.Ports != null)
            .Select(r => r.Ports)
            .ToListAsync();
        var ports = new HashSet<int>();

        foreach (var token in allowPorts.SelectMany(portsStr => portsStr!.Split(',', StringSplitOptions.RemoveEmptyEntries)))
            if (int.TryParse(token.Trim(), out var p)) ports.Add(p);
        return ports.Count;
    }

    private static bool IsValidCidr(string? cidr, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(cidr))
            return true;

        if (cidr.Contains('/'))
        {
            var parts = cidr.Split('/', 2);
            if (System.Net.IPAddress.TryParse(parts[0], out _) &&
                int.TryParse(parts[1], out var prefix) && prefix is >= 0 and <= 32)
            {
                return true;
            }
            
            error = "Invalid CIDR";
            return false;
        }

        if (System.Net.IPAddress.TryParse(cidr, out _))
            return true;
        
        error = "Invalid IP or CIDR";
        return false;
    }

    private static bool IsValidPorts(string? ports, out string? error)
    {
        error = null;
        if (string.IsNullOrWhiteSpace(ports)) return true;

        foreach (var token in ports.Split(',',
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var range = token.Split('-');
            switch (range.Length)
            {
                case 1:
                {
                    if (!int.TryParse(range[0], out var p) || p is < 1 or > 65535)
                    {
                        error = $"Invalid port: {token}";
                        return false;
                    }

                    break;
                }
                
                case 2:
                {
                    if (!int.TryParse(range[0], out var lo) || !int.TryParse(range[1], out var hi)
                                                            || lo is < 1 or > 65535 || hi is < 1 or > 65535 || lo > hi)
                    {
                        error = $"Invalid port range: {token}";
                        return false;
                    }

                    break;
                }
                
                default:
                    error = $"Invalid port: {token}";
                    return false;
            }
        }
        return true;
    }
}

public record WdRuleRequest(string Name, string? SourceCidr, string? Ports,
    WdProtocol Protocol, WdRuleAction Action, bool Enabled = true, int? Priority = null);

public record WdSettingsRequest(bool FirewallEnabled, WdSecurityProfile Profile,
    double? CustomThresholdFactor = null, double? CustomDurationFactor = null);