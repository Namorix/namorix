namespace Namorix.Server.Infrastructure;

public interface IFrontgateNotifier
{
    Task NotifyCertStatusChanged(string certId, string status, string? issuer, DateTime? expiresAt);
}