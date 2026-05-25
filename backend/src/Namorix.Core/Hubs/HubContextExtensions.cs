using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Namorix.Core.Constants;

namespace Namorix.Core.Hubs;

public static class HubContextExtensions
{
    public static void RequireAdmin(this HubCallerContext context, ILogger logger)
    {
        var roleClaim = context.User?.Claims.FirstOrDefault(c => c.Type == JwtClaims.Role)?.Value;
        if (roleClaim != null && int.Parse(roleClaim) == UserRole.Admin) return;
        
        logger.LogWarning("Non-admin SignalR call blocked: userId={UserId}, connectionId={ConnectionId}",
            context.UserIdentifier, context.ConnectionId);
        
        throw new HubException("Forbidden");
    }
}