using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Channels;
using Certes;
using Certes.Acme;
using Certes.Acme.Resource;
using Microsoft.EntityFrameworkCore;
using Namorix.Core.Constants;
using Namorix.Core.IO;
using Namorix.Server.Infrastructure;
using Namorix.Server.Models.Frontgate;
using Namorix.Server.Persistence;
using Directory = System.IO.Directory;

namespace Namorix.Server.Services.Frontgate;

public class AcmeCertQueue(IServiceScopeFactory scopeFactory, ILogger<AcmeCertQueue> logger)
    : BackgroundService
{
    private readonly Channel<string> _channel = Channel.CreateBounded<string>(
        new BoundedChannelOptions(50) { FullMode = BoundedChannelFullMode.Wait });
    private readonly SemaphoreSlim _concurrency = new(2, 2);

    public async Task EnqueueAsync(string certId)
    {
        await _channel.Writer.WriteAsync(certId);
        logger.LogInformation("Enqueued ACME cert issuance for {CertId}", certId);
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var certId in _channel.Reader.ReadAllAsync(ct))
        {
            await _concurrency.WaitAsync(ct);
            _ = ProcessAsync(certId, ct);
        }
    }

    private async Task ProcessAsync(string certId, CancellationToken ct)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var dataDir = scope.ServiceProvider.GetRequiredService<DataDirectory>();
            var challengeStore = scope.ServiceProvider.GetRequiredService<AcmeChallengeStore>();

            var cert = await db.FgCertificates
                .Include(c => c.CertificateDomains)
                .FirstOrDefaultAsync(c => c.Id == certId, ct);
            
            if (cert is not { Status: FgCertificateStatus.Pending })
                return;

            var domains = cert.CertificateDomains.Select(d => d.Domain).ToArray();
            if (domains.Length == 0)
                throw new InvalidOperationException("No domains on certificate");

            var accountKey = await GetOrCreateAccountKeyAsync(dataDir, ct);
            var acme = new AcmeContext(WellKnownServers.LetsEncryptV2, accountKey);

            var adminEmail = await db.Users
                .Where(u => u.Role == UserRole.Admin)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(ct);

            if (string.IsNullOrEmpty(adminEmail))
                throw new InvalidOperationException("Admin email not found for ACME account registration");

            await acme.NewAccount(
                contact: [$"mailto:{adminEmail}"],
                termsOfServiceAgreed: true);

            var order = await acme.NewOrder(domains);

            var authorizations = await order.Authorizations();

            foreach (var auth in authorizations)
            {
                var httpChallenge = await auth.Http();
                challengeStore.Add(httpChallenge.Token, httpChallenge.KeyAuthz);

                var validation = await httpChallenge.Validate();
                for (var i = 0; i < 60 && validation.Status == ChallengeStatus.Pending; i++)
                {
                    ct.ThrowIfCancellationRequested();
                    await Task.Delay(TimeSpan.FromSeconds(1), ct);
                    validation = await httpChallenge.Resource();
                }

                challengeStore.Remove(httpChallenge.Token);

                if (validation.Status != ChallengeStatus.Valid)
                    throw new Exception($"Challenge invalid: {validation.Error?.Detail}");
            }

            var certKey = KeyFactory.NewKey(cert.Type == CertificateType.Ecdsa
                ? KeyAlgorithm.ES256 : KeyAlgorithm.RS256);
            var csr = new CsrInfo { CommonName = domains[0] };
            var chain = await order.Generate(csr, certKey);   // retryCount (default 1) + preferredChain optional
            var fullchainPem = chain.ToPem(certKey);
            var privateKeyPem = certKey.ToPem();

            var name = domains[0].Replace('*', '_');
            var certDir = Path.Combine(DataDirectory.CertDir, name);
            dataDir.WriteFile(Path.Combine(certDir, DataDirectory.PrivateKeyFile), Encoding.UTF8.GetBytes(privateKeyPem));
            dataDir.WriteFile(Path.Combine(certDir, DataDirectory.FullChainFile), Encoding.UTF8.GetBytes(fullchainPem));

            var x509 = X509Certificate2.CreateFromPem(fullchainPem);
            var expiresAt = x509.NotAfter.ToUniversalTime();

            await db.FgCertificates
                .Where(c => c.Id == certId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Status, FgCertificateStatus.Active)
                    .SetProperty(c => c.ExpiresAt, expiresAt)
                    .SetProperty(c => c.Issuer, x509.Issuer), ct);

            logger.LogInformation("Issued ACME cert for {Domain} (expires {ExpiresAt:O})",
                domains[0], expiresAt);
            
            var notifier = scope.ServiceProvider.GetRequiredService<IFrontgateNotifier>();
            await notifier.NotifyCertStatusChanged(certId, FgCertificateStatus.Active, x509.Issuer, expiresAt);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogError(ex, "ACME issuance failed for cert {CertId}", certId);
            await SetErrorStatusAsync(certId, ex.Message);
        }
        finally
        {
            _concurrency.Release();
        }
    }

    private async Task SetErrorStatusAsync(string certId, string error)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.FgCertificates
                .Where(c => c.Id == certId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.Status, FgCertificateStatus.Error));
            
            var notifier = scope.ServiceProvider.GetRequiredService<IFrontgateNotifier>();
            await notifier.NotifyCertStatusChanged(certId, FgCertificateStatus.Error, null, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to set error status for cert {CertId}", certId);
        }
    }

    private static async Task<IKey> GetOrCreateAccountKeyAsync(DataDirectory dataDir, CancellationToken ct)
    {
        var path = Path.Combine(dataDir.PkiPath, "acme-account.key");
        if (File.Exists(path))
            return KeyFactory.FromPem(await File.ReadAllTextAsync(path, ct));

        var key = KeyFactory.NewKey(KeyAlgorithm.ES256);
        Directory.CreateDirectory(dataDir.PkiPath);
        await File.WriteAllTextAsync(path, key.ToPem(), ct);
        return key;
    }
}