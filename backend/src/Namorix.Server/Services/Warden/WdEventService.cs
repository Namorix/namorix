using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Warden;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services.Warden;

public class WdEventService(AppDbContext db, IWardenNotifier notifier)
{
    public async Task PublishAsync(string eventType, WdSeverity severity,
        string sourceAddon, string? sourceIp, int count = 1,
        string? detailJson = null, CancellationToken ct = default)
    {
        var evt = new WdSecurityEvent
        {
            EventType = eventType, Severity = severity, SourceAddon = sourceAddon,
            SourceIp = sourceIp, Count = count,
            WindowStart = DateTime.UtcNow, Timestamp = DateTime.UtcNow,
            DetailJson = detailJson
        };
        db.WdSecurityEvents.Add(evt);
        await db.SaveChangesAsync(ct);
        await notifier.NotifyNewEvent(evt);
    }
}