using Microsoft.Extensions.Logging;
using Namorix.Core.OAuth;

namespace Namorix.Core.AddonSession;

// The sweep itself, callable from both triggers: the timer in AddonTokenCleanupWorker, and
// the end of a successful login. The login pass is the only one guaranteed to run with a
// known ClientId — the channel that learns it connects on a background task that no hosted
// service waits for — so it is the one that reliably clears grants left by an earlier ClientId.
public sealed class AddonTokenCleanup(
    IAddonTokenStore tokens,
    NmxOAuth2Client oauth,
    ILogger<AddonTokenCleanup> logger)
{
    public async Task RunAsync(CancellationToken ct)
    {
        try
        {
            var expired = await tokens.DeleteExpiredAsync(ct);
            if (expired > 0)
                logger.LogInformation("Dropped {Count} expired addon grant(s)", expired);

            // ClientId is null until the channel authenticates. Skipping is the only safe
            // answer: deleting on an unknown id would take every grant the addon holds.
            if (oauth.ClientId is not { } clientId)
                return;

            var others = await tokens.DeleteOtherClientsAsync(clientId, ct);
            if (others > 0)
                logger.LogInformation(
                    "Dropped {Count} addon grant(s) left by an earlier ClientId", others);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean up addon grants");
        }
    }
}
