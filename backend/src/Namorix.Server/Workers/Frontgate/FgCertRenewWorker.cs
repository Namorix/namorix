using Microsoft.EntityFrameworkCore;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Namorix.Server.Services.Frontgate;

namespace Namorix.Server.Workers.Frontgate;

    public sealed class FgCertRenewWorker(
        IServiceScopeFactory scopeFactory,
        AcmeCertQueue certQueue,
        ILogger<FgCertRenewWorker> logger) : BackgroundService
    {
        private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(24);
        private const int RenewDaysBefore = 30;

        protected override async Task ExecuteAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await RenewAsync(ct);
                }
                catch (OperationCanceledException) { }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Certificate auto-renew check failed");
                }
                await Task.Delay(CheckInterval, ct);
            }
        }

        private async Task RenewAsync(CancellationToken ct)
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var expireCutoff = DateTime.UtcNow.AddDays(RenewDaysBefore);
            var certs = await db.FgCertificates
                .Where(c => c.AutoRenew
                            && c.Status == FgCertificateStatus.Active
                            && c.ExpiresAt < expireCutoff)
                .ToListAsync(ct);

            var count = 0;
            foreach (var cert in certs)
            {
                await db.FgCertificates
                    .Where(c => c.Id == cert.Id)
                    .ExecuteUpdateAsync(s =>
                        s.SetProperty(c => c.Status, FgCertificateStatus.Pending), ct);
                await certQueue.EnqueueAsync(cert.Id);
                count++;
            }

            if (count > 0)
                logger.LogInformation("Enqueued {Count} cert(s) for renewal", count);
        }
    }
