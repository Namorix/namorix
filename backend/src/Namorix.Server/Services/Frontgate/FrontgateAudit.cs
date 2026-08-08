using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Namorix.Core.Constants;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services.Frontgate;

public static class FrontgateAudit
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static (string actor, string? actorId, string? ip) Who(HttpContext ctx)
    {
        var actor = ctx.User.FindFirstValue(JwtClaims.Username) ?? "system";
        var actorId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ip = ctx.Items.TryGetValue(HttpContextKeys.RealIp, out var raw) && raw is string s ? s : null;
        return (actor, actorId, ip);
    }

    public static async Task LogAsync(AppDbContext db, IFrontgateNotifier notifier,
        (string actor, string? actorId, string? ip) who,
        FgAuditTargetType targetType,
        string? targetId,
        string? targetName,
        FgAuditAction action,
        string? before = null,
        string? after = null)
    {
        db.FgAuditLogs.Add(new FgAuditLog
        {
            Actor = who.actor,
            ActorId = who.actorId,
            ClientIp = who.ip,
            TargetType = targetType,
            TargetId = targetId,
            TargetName = targetName,
            Action = action,
            BeforeJson = before,
            AfterJson = after,
        });
        await db.SaveChangesAsync();
        await notifier.NotifyAuditCreated(targetType, targetId, action);
    }
}