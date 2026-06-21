namespace Namorix.Server.Infrastructure;

public interface IAddonNotifier
{
    Task NotifyAddonStatusChanged(string addonId, string status);
}