    using System.Collections.Concurrent;
    using System.Security.Cryptography.X509Certificates;
    using Microsoft.EntityFrameworkCore;
    using Namorix.Core.IO;
    using Namorix.Server.Models.Frontgate;
    using Namorix.Server.Persistence;

    namespace Namorix.Server.Services.Frontgate;

    public class SniCertProvider(IServiceScopeFactory scopeFactory, DataDirectory dataDir)
    {
        private static readonly ConcurrentDictionary<string, X509Certificate2> Cache = new();
        private static readonly ConcurrentDictionary<string, DateTime> CacheTime = new();

        public async Task<X509Certificate2?> GetCertAsync(string hostname, CancellationToken ct)
        {
            // Check cache (5 min TTL)
            if (Cache.TryGetValue(hostname, out var cached) &&
                CacheTime.TryGetValue(hostname, out var ts) &&
                DateTime.UtcNow - ts < TimeSpan.FromMinutes(5))
                return cached;

            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var domain = await db.FgCertificateDomains
                .Where(d => d.Domain == hostname && d.Certificate.Status == FgCertificateStatus.Active)
                .Select(d => new { d.Domain, d.Certificate.Type })
                .FirstOrDefaultAsync(ct);

            if (domain == null) return null;

            var name = hostname.Replace('*', '_');
            var certPath = Path.Combine(dataDir.BasePath, DataDirectory.CertDir, name);
            var fullchainPath = Path.Combine(certPath, DataDirectory.FullChainFile);
            var privatekeyPath = Path.Combine(certPath, DataDirectory.PrivateKeyFile);

            if (!File.Exists(fullchainPath) || !File.Exists(privatekeyPath))
                return null;

            var cert = X509Certificate2.CreateFromPemFile(fullchainPath, privatekeyPath);
            Cache[hostname] = cert;
            CacheTime[hostname] = DateTime.UtcNow;
            return cert;
        }

        public static void Invalidate(string hostname)
        {
            Cache.TryRemove(hostname, out _);
            CacheTime.TryRemove(hostname, out _);
        }
    }
