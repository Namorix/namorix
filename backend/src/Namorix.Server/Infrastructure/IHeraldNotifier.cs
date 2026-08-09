using Namorix.Server.Models.Warden;

namespace Namorix.Server.Infrastructure;

public interface IHeraldNotifier
{
    Task NotifyRuleAppliedAsync(WdFirewallRule rule);
    Task NotifyRuleRemovedAsync(WdFirewallRule rule);
}