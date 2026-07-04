namespace Namorix.Server.Infrastructure;

public interface IAddonNotifier
{
    Task NotifyAddonStatusChanged(string addonId, string status, string? lastErrorCode = null);
    Task NotifyPendingTaskChanged(string addonId, string? phase);
    Task NotifyAddonUninstalled(string addonId);
    Task NotifyAddonWidgetEvent(string addonId, string payload);
}