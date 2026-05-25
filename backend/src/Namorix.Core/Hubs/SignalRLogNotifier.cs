using Microsoft.AspNetCore.SignalR;
using Namorix.Core.Constants;
using Namorix.Core.FlatFile;
using Namorix.Core.Infrastructure;

namespace Namorix.Core.Hubs;

public class SignalRLogNotifier(IHubContext<NmxHub> hubContext) : ILogNotifier
{
    public async Task NotifyFlushAsync(IReadOnlyList<LogEntrySerializer> entries)
    {
        await hubContext.Clients
            .Group(SignalRGroups.Logs)
            .SendAsync(SignalREvents.LogsNewEntry, entries);
    }
}