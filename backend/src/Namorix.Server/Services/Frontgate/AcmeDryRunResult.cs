using Certes;
using Certes.Acme;
using Certes.Acme.Resource;
using Namorix.Core.IO;
using Directory = System.IO.Directory;

namespace Namorix.Server.Services.Frontgate;

public record AcmeDryRunResult(bool Passed, string? Message);

public class AcmeDryRunService(
    DataDirectory dataDir,
    AcmeChallengeStore challengeStore,
    ILogger<AcmeDryRunService> logger)
{
    private static readonly TimeSpan ValidationTimeout = TimeSpan.FromSeconds(60);

    public async Task<AcmeDryRunResult> RunAsync(IList<string> domains, CancellationToken ct)
    {
        try
        {
            var key = await GetOrCreateStagingAccountKeyAsync(ct);
            var acme = new AcmeContext(WellKnownServers.LetsEncryptStagingV2, key);
            
            await acme.NewAccount(null, true);
            
            var order = await acme.NewOrder(domains);
            var authorizations = await order.Authorizations();

            foreach (var auth in authorizations)
            {
                var httpChallenge = await auth.Http();
                challengeStore.Add(httpChallenge.Token, httpChallenge.KeyAuthz);
                try
                {
                    var validation = await httpChallenge.Validate();
                    var deadline = DateTime.UtcNow + ValidationTimeout;
                    while (validation.Status == ChallengeStatus.Pending && DateTime.UtcNow < deadline)
                    {
                        ct.ThrowIfCancellationRequested();
                        await Task.Delay(TimeSpan.FromSeconds(1), ct);
                        validation = await httpChallenge.Resource();
                    }

                    if (validation.Status != ChallengeStatus.Valid)
                    {
                        Console.WriteLine(validation.Error?.Detail);
                        return new AcmeDryRunResult(false, validation.Error?.Detail ?? "Challenge not valid");
                    }
                }
                finally
                {
                    challengeStore.Remove(httpChallenge.Token); // clean up tokens (both success and failure)
                }
            }

            // DO NOT generate/finalize — do not issue production cert (to avoid burning LE prod rate-limits)
            return new AcmeDryRunResult(true, null);
        }
        catch (OperationCanceledException)
        {
            return new AcmeDryRunResult(false, "Timed out");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "ACME dry-run failed");
            return new AcmeDryRunResult(false, ex.Message);
        }
    }

    private async Task<IKey> GetOrCreateStagingAccountKeyAsync(CancellationToken ct)
    {
        var path = Path.Combine(dataDir.PkiPath, "acme-staging-account.key");

        if (File.Exists(path))
            return KeyFactory.FromPem(await File.ReadAllTextAsync(path, ct));

        var key = KeyFactory.NewKey(KeyAlgorithm.ES256);
        Directory.CreateDirectory(dataDir.PkiPath);
        await File.WriteAllTextAsync(path, key.ToPem(), ct);
        return key;
    }
}