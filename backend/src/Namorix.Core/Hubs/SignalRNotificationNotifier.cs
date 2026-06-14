using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;
using Namorix.Core.Responses;

namespace Namorix.Core.Hubs;

public class SignalRNotificationNotifier<THub>(IHubContext<THub> hubContext) : INotificationNotifier where THub: NmxHub
{
    public Task NotifyReceivedAsync(int userId, NotificationDto notification) =>
        hubContext.Clients.User(userId.ToString())
            .SendAsync(SignalREvents.NotificationReceived, notification);

    public Task NotifyReadStatusAsync(int userId, int notificationId, bool isRead) =>
        hubContext.Clients.User(userId.ToString())
            .SendAsync(SignalREvents.NotificationReadStatus, new { id = notificationId, isRead });
}