using Namorix.Server.Constants;
using Namorix.Server.Models.Frontgate;

namespace Namorix.Server.Infrastructure;

public interface IFrontgateNotifier
{
    Task NotifyCertStatusChanged(string certId, FgCertificateStatus status, string? issuer, DateTime? expiresAt);
    Task NotifyDryRunChanged(string ruleId, FgDryRunAction action);
    Task NotifyRuleChanged(string ruleId, FgRuleAction action);
    Task NotifyCertChanged(string certId, FgCertAction action);

}