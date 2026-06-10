namespace Namorix.Core.Infrastructure;

public interface IUserSettingsNotifier
{
    Task NotifyUserSettingsChangedAsync(int userId);
}