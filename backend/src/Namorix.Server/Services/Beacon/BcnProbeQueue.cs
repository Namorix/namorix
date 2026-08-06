using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Beacon;
using Namorix.Server.Persistence;

namespace Namorix.Server.Services.Beacon;

public sealed class BcnProbeQueue(IServiceScopeFactory scopeFactory, ILogger<BcnProbeQueue> logger)
    : BackgroundService
{
    private readonly Channel<int> _channel = Channel.CreateBounded<int>(
        new BoundedChannelOptions(4)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

    public async Task EnqueueAsync() => await _channel.Writer.WriteAsync(1);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var _ in _channel.Reader.ReadAllAsync(ct))
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var updater = scope.ServiceProvider.GetRequiredService<BcnHostnameService>();
            var notifier = scope.ServiceProvider.GetRequiredService<IBeaconNotifier>();
            var hosts = await db.BcnHostnames
                .Where(h => h.Status != BcnHostnameStatus.Disabled).ToListAsync(ct);
            var updated = 0;
                
            foreach (var host in hosts)
            {
                var r = await updater.RefreshHostFromProviderAsync(host, ct);
                if (r is { Supported: true, Error: false }) updated++;
            }
                
            await db.SaveChangesAsync(ct);
            await notifier.NotifyHostnamesRefreshed(updated);
            logger.LogInformation("Beacon refresh probed {Updated} updated out of {Total}", updated, hosts.Count);
        }
    }
}