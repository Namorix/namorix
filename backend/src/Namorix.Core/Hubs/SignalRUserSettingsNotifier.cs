using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;

namespace Namorix.Core.Hubs;

public class SignalRUserSettingsNotifier<THub>(IHubContext<THub> hubContext) : IUserSettingsNotifier where THub: NmxHub
{
    public Task NotifyUserSettingsChangedAsync(int userId) =>
        hubContext.Clients.User(userId.ToString())
            .SendAsync(SignalREvents.UserSettingsChanged, new UserSettingsChanged(userId));
}