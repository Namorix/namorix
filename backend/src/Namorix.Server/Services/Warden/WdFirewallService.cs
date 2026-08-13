using System.Diagnostics;
using System.Text.Json;
using Namorix.Core.Constants;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Warden;

namespace Namorix.Server.Services.Warden;

public class WdFirewallService(
    ILogger<WdFirewallService> logger,
    IServiceScopeFactory scopeFactory)
{
    private const string CommentPrefix = "wd:";
    private const string Chain = "INPUT"; // container netns — Frontgate cùng netns nên INPUT là đúng chain

    // Serialize check-then-act (-C rồi -I/-D) — nếu để trong ExecAsync thì 2 thread vẫn có thể
    // check "chưa tồn tại" rồi cùng insert (TOCTOU). Lock phải bao cả cặp.
    private readonly SemaphoreSlim _iptablesLock = new(1, 1);

    public async Task<bool> ApplyRuleAsync(WdFirewallRule rule, bool notify = true, CancellationToken ct = default)
    {
        if (rule.Action != WdRuleAction.Deny || !rule.Enabled)
        {
            logger.LogInformation("[Warden] skip rule #{Id} {Name} (not deny/disabled)", rule.Id, rule.Name);
            return true; // nothing to enforce -> ok
        }

        if (!string.IsNullOrWhiteSpace(rule.SourceCidr))
        {
            var (ok, inserted) = await UpsertRuleAsync(rule, ct);
            if (ok && inserted && notify)
                await NotifyRuleAppliedAsync(rule);
            return ok;
        }

        logger.LogWarning("[Warden] skip deny rule #{Id} {Name} — SourceCidr null would drop ALL traffic", rule.Id, rule.Name);
        return false;
    }

    public async Task<bool> RemoveRuleAsync(WdFirewallRule rule, bool notify = true, CancellationToken ct = default)
    {
        if (rule.Action != WdRuleAction.Deny || string.IsNullOrWhiteSpace(rule.SourceCidr))
            return true;

        bool removed;
        await _iptablesLock.WaitAsync(ct);
        try
        {
            if (!await RuleExistsAsync(rule, ct))
                return true;

            removed = await RunIptablesAsync("-D", rule, ct);
        }
        finally
        {
            _iptablesLock.Release();
        }

        if (removed && notify)
            await NotifyRuleRemovedAsync(rule);   // ngoài lock
        return removed;
    }

    public async Task ApplyAllAsync(IReadOnlyList<WdFirewallRule> rules, bool notify = false, CancellationToken ct = default)
    {
        foreach (var rule in rules)
            await ApplyRuleAsync(rule, notify, ct);
    }

    private async Task<(bool Ok, bool Inserted)> UpsertRuleAsync(WdFirewallRule rule, CancellationToken ct)
    {
        await _iptablesLock.WaitAsync(ct);
        try
        {
            // -C = check for existence, no changes made — avoids rule duplication when the service restarts/resyncs
            if (!await RuleExistsAsync(rule, ct))
                return (await RunIptablesAsync("-I", rule, ct), true);   // -I: insert trước các ACCEPT rule

            logger.LogInformation("[Warden] rule #{Id} {Name} already applied, skip", rule.Id, rule.Name);
            return (true, false);   // đã tồn tại → không phải "mới applied"
        }
        finally
        {
            _iptablesLock.Release();
        }
    }

    private async Task NotifyRuleAppliedAsync(WdFirewallRule rule)
    {
        using var scope = scopeFactory.CreateScope();
        var herald = scope.ServiceProvider.GetRequiredService<IHeraldNotifier>();
        await herald.NotifyRuleAppliedAsync(rule);

        var events = scope.ServiceProvider.GetRequiredService<WdEventService>();
        await events.PublishAsync(
            rule.Auto ? WdEventTypes.AutoBan : WdEventTypes.RuleApplied,
            rule.Auto ? WdSeverity.Critical : WdSeverity.Warning,
            AddonSourceId.Warden, rule.SourceCidr,
            detailJson: JsonSerializer.Serialize(new
            {
                ruleId = rule.Id,
                name = rule.Name,
                action = WdEventAction.Applied
            }));
    }

    private async Task NotifyRuleRemovedAsync(WdFirewallRule rule)
    {
        using var scope = scopeFactory.CreateScope();
        var herald = scope.ServiceProvider.GetRequiredService<IHeraldNotifier>();
        await herald.NotifyRuleRemovedAsync(rule);

        var expired = rule is { Auto: true, ExpiresAt: not null } && rule.ExpiresAt < DateTime.UtcNow;
        var events = scope.ServiceProvider.GetRequiredService<WdEventService>();
        await events.PublishAsync(
            expired ? WdEventTypes.BanExpired : WdEventTypes.RuleRemoved,
            WdSeverity.Info,
            AddonSourceId.Warden, rule.SourceCidr,
            detailJson: JsonSerializer.Serialize(new
            {
                ruleId = rule.Id,
                name = rule.Name,
                action = WdEventAction.Removed
            }));
    }

    // RuleExistsAsync / RunIptablesAsync / ExecAsync / BuildArgList — giữ nguyên
    private async Task<bool> RuleExistsAsync(WdFirewallRule rule, CancellationToken ct)
    {
        var argList = BuildArgList("-C", rule);
        var (exitCode, _) = await ExecAsync(argList, ct);
        return exitCode == 0;
    }

    private async Task<bool> RunIptablesAsync(string action, WdFirewallRule rule, CancellationToken ct)
    {
        var argList = BuildArgList(action, rule);
        logger.LogInformation("[Warden] iptables {Args}", string.Join(' ', argList));

        var (exitCode, stderr) = await ExecAsync(argList, ct);
        if (exitCode == 0) return true;

        var msg = stderr.Trim();
        if (exitCode == 4
            || msg.Contains("Permission denied", StringComparison.OrdinalIgnoreCase)
            || msg.Contains("Operation not permitted", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogWarning(
                "[Warden] iptables {Args} requires NET_ADMIN (+ seccomp unconfined if blocked) on namorix container ({Code}): {Err}",
                string.Join(' ', argList), exitCode, msg);
            return false;
        }

        logger.LogError("iptables {Args} failed ({Code}): {Err}", string.Join(' ', argList), exitCode, msg);
        return false;
    }

    private async Task<(int ExitCode, string StdErr)> ExecAsync(List<string> argList, CancellationToken ct)
    {
        try
        {
            var psi = new ProcessStartInfo("iptables")
            {
                RedirectStandardOutput = false, // Do not read stdout -> do not redirect, avoids hanging the pipe
                RedirectStandardError = true,
                UseShellExecute = false
            };
            foreach (var a in argList) psi.ArgumentList.Add(a);

            using var proc = Process.Start(psi);
            if (proc is null)
            {
                logger.LogError("Failed to start iptables");
                return (-1, "");
            }

            var stderr = await proc.StandardError.ReadToEndAsync(ct);
            await proc.WaitForExitAsync(ct);
            return (proc.ExitCode, stderr);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "iptables exec error");
            return (-1, ex.Message);
        }
    }

    private static List<string> BuildArgList(string action, WdFirewallRule rule)
    {
        // "-w" waits for xtables lock instead of failing immediately if another command is running concurrently
        var parts = new List<string> { "-w", action, Chain };

        if (!string.IsNullOrWhiteSpace(rule.SourceCidr))
            parts.AddRange(["-s", rule.SourceCidr]);

        var protocol = rule.Protocol == WdProtocol.Any && !string.IsNullOrWhiteSpace(rule.Ports)
            ? WdProtocol.Tcp
            : rule.Protocol;
        if (protocol != WdProtocol.Any)
            parts.AddRange(["-p", protocol.ToString().ToLowerInvariant()]);

        if (!string.IsNullOrWhiteSpace(rule.Ports))
            parts.AddRange(["-m", "multiport", "--dports", rule.Ports]);

        parts.AddRange(["-m", "comment", "--comment", $"{CommentPrefix}{rule.Id}"]);
        parts.AddRange(["-j", rule.Action == WdRuleAction.Deny ? "DROP" : "ACCEPT"]);

        return parts;
    }
}