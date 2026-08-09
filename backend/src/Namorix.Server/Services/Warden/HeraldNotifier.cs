using Namorix.Core.Constants;
using Namorix.Server.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Warden;
using NotificationKeys = Namorix.Server.Constants.NotificationKeys;

namespace Namorix.Server.Services.Warden;

public class HeraldNotifier(NotificationService notifications) : IHeraldNotifier
{
    public async Task NotifyRuleAppliedAsync(WdFirewallRule rule)
    {
        if (rule.Action != WdRuleAction.Deny)
            return;
        
        await notifications.CreateForAdminsAsync(NotificationType.Warning, NotificationKeys.Warden.RuleApplied,
            AddonSourceId.Warden, new
            {
                name = rule.Name,
                sourceCidr = rule.SourceCidr,
                expiresAt = rule.ExpiresAt
            });
    }

    public async Task NotifyRuleRemovedAsync(WdFirewallRule rule)
    {
        if (rule.Action != WdRuleAction.Deny)
            return;
        
        await notifications.CreateForAdminsAsync(NotificationType.Info, NotificationKeys.Warden.RuleRemoved,
            AddonSourceId.Warden, 
            new
            {
                name = rule.Name,
                sourceCidr = rule.SourceCidr
            });
    }
}