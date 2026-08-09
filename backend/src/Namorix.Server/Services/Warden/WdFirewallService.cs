using Namorix.Server.Models.Warden;

namespace Namorix.Server.Services.Warden;

public class WdFirewallService(ILogger<WdFirewallService> logger)
{
    // Phase 2: render rule -> iptables/nftables via Process.Start
    public Task ApplyRuleAsync(WdFirewallRule rule, CancellationToken ct = default)
    {
        logger.LogInformation("[Warden] apply rule #{Id} {Name} -> {Action}", rule.Id, rule.Name, rule.Action);
        return Task.CompletedTask;
    }

    public Task RemoveRuleAsync(WdFirewallRule rule, CancellationToken ct = default)
    {
        logger.LogInformation("[Warden] remove rule #{Id} {Name}", rule.Id, rule.Name);
        return Task.CompletedTask;
    }

    public Task ApplyAllAsync(IReadOnlyList<WdFirewallRule> rules, CancellationToken ct = default)
    {
        logger.LogInformation("[Warden] apply {Count} rules (stub)", rules.Count);
        return Task.CompletedTask;
    }
}