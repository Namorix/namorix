using Microsoft.EntityFrameworkCore;
using Namorix.Adapters.Persistence;
using Namorix.Core.Infrastructure;
using Namorix.Core.Models;
using Namorix.Core.Responses;
using System.Text.Json;

namespace Namorix.Adapters.Services;

public class NotificationService(
    AppDbContext db,
    INotificationNotifier notifier)
{
    public async Task<(List<NotificationDto> Items, int TotalCount)> GetNotificationsAsync(
        int userId, int page, int pageSize)
    {
        var query = db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Key = n.Key,
                Params = n.Params,
                Source = n.Source,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<int> GetUnreadCountAsync(int userId) =>
        await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

    public async Task<bool> MarkAsReadAsync(int userId, int notificationId)
    {
        var notif = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notif == null) return false;

        notif.IsRead = true;
        await db.SaveChangesAsync();
        await notifier.NotifyReadStatusAsync(userId, notificationId, true);
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(int userId)
    {
        var count = await db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(n => n.IsRead, true));
        return count;
    }

    public async Task<bool> DeleteAsync(int userId, int notificationId)
    {
        var notif = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
        if (notif == null) return false;

        db.Notifications.Remove(notif);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<NotificationDto> CreateAsync(
        int userId, string type, string key,
        string? source, object? paramsObj)
    {
        var notif = new Notification
        {
            UserId = userId,
            Type = type,
            Key = key,
            Params = paramsObj != null ? JsonSerializer.Serialize(paramsObj) : null,
            Source = source,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
        };
        db.Notifications.Add(notif);
        await db.SaveChangesAsync();
        var dto = new NotificationDto
        {
            Id = notif.Id,
            Type = notif.Type,
            Key = notif.Key,
            Params = notif.Params,
            Source = notif.Source,
            IsRead = notif.IsRead,
            CreatedAt = notif.CreatedAt,
        };
        await notifier.NotifyReceivedAsync(userId, dto);
        return dto;
    }
}