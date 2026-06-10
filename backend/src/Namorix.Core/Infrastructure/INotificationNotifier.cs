using Namorix.Core.Responses;

namespace Namorix.Core.Infrastructure;

public interface INotificationNotifier
{
    Task NotifyReceivedAsync(int userId, NotificationDto notification);
    Task NotifyReadStatusAsync(int userId, int notificationId, bool isRead);
}