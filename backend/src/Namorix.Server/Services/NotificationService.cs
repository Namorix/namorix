using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Namorix.Core.Constants;
using Namorix.Core.Infrastructure;
using Namorix.Core.Models;
using Namorix.Core.Responses;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services;

public class NotificationService(AppDbContext db, INotificationNotifier notifier, IMemoryCache memoryCache)
{
    private const string AdminCacheKey = "notification:adminIds";

    public async Task<(List<NotificationDto> Items, int TotalCount)> GetNotificationsAsync(
        int userId, int page, int pageSize)
    {
        var query = db.Notifications
            .Where(n => n.UserId == userId)
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => MapToDto(n))
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

    public async Task<NotificationDto?> CreateAsync(
        string username, string type, string key,
        string? source, object? paramsObj)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return null;
        return await CreateAsync(user.Id, type, key, source, paramsObj);
    }
    
    public async Task<NotificationDto> CreateAsync(
        int userId, string type, string key,
        string? source, object? paramsObj)
    {
        var paramsJson = paramsObj != null ? JsonSerializer.Serialize(paramsObj) : null;

        var existing = await db.Notifications
            .FirstOrDefaultAsync(n =>
                n.UserId == userId &&
                n.Key == key &&
                n.Params == paramsJson &&
                !n.IsRead);

        if (existing != null)
        {
            existing.Occurrences++;
            existing.LastOccurredAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var dto = MapToDto(existing);
            await notifier.NotifyReceivedAsync(userId, dto);
            return dto;
        }

        var notif = new Notification
        {
            UserId = userId,
            Type = type,
            Key = key,
            Params = paramsJson,
            Source = source,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Occurrences = 1,
            LastOccurredAt = DateTime.UtcNow,
        };

        db.Notifications.Add(notif);
        await db.SaveChangesAsync();

        var newDto = MapToDto(notif);
        await notifier.NotifyReceivedAsync(userId, newDto);
        return newDto;
    }
    
    public async Task CreateForAdminsAsync(
        string type, string key, string? source, object? paramsObj,
        int? excludeUserId = null)
    {
        var adminIds = await memoryCache.GetOrCreateAsync(AdminCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Time.ExpirationRelativeToNow;
            return await db.Users
                .Where(u => u.Role == UserRole.Admin)
                .Select(u => u.Id)
                .ToListAsync();
        }) ?? [];

        foreach (var adminId in adminIds.Where(adminId => excludeUserId == null || adminId != excludeUserId))
            await CreateAsync(adminId, type, key, source, paramsObj);
    }
    
    public async Task DeleteReadAsync(int userId)
    {
        await db.Notifications
            .Where(n => n.UserId == userId && n.IsRead)
            .ExecuteDeleteAsync();
    }
    
    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Key = n.Key,
        Params = n.Params,
        Source = n.Source,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
        Occurrences = n.Occurrences,
        LastOccurredAt = n.LastOccurredAt,
    };
}