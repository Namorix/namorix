using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Namorix.Core.Hubs;

public class NmxHubFilter(ILogger<NmxHubFilter> logger): IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        try
        {
            return await next(invocationContext);
        }
        catch (Exception e)
        {
            logger.LogError(e, "SignalR hub error: {Hub}.{Method}",
                invocationContext.Hub.GetType().Name,
                invocationContext.HubMethodName);
            throw new HubException("An internal error occurred");
        }
    }
}