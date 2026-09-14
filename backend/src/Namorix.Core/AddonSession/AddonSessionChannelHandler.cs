using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Namorix.Core.Grpc;
using Namorix.Core.OAuth;
using Namorix.Core.Protos;

namespace Namorix.Core.AddonSession;

// Turns the desktop's two revocation signals into token-store changes:
//   session-revoked — pushed the moment a grant dies, while we are online;
//   session-grants  — the live list pushed on every (re)connect, which covers the window
//                     where we were down and the push reached nobody.
// Without this the addon keeps refreshing with a token the desktop has already killed, and
// only learns otherwise when the refresh comes back invalid_grant.
public sealed class AddonSessionChannelHandler(
    AddonChannelClient channel,
    NmxOAuth2Client oauth,
    IAddonTokenStore tokens,
    ILogger<AddonSessionChannelHandler> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        channel.OnMessageAsync += HandleMessageAsync;

        // The list may already have arrived before we subscribed: hosted services start in
        // registration order, and the addon owns the service that opens the channel.
        await ApplyGrantsAsync(channel.ActiveGrantUserIds);
    }

    public Task StopAsync(CancellationToken ct)
    {
        channel.OnMessageAsync -= HandleMessageAsync;
        return Task.CompletedTask;
    }

    private async Task HandleMessageAsync(ShellMessage message)
    {
        switch (message.Type)
        {
            case SessionRevokedMessage.Type:
                if (SessionRevokedMessage.ParseUserId(message.Payload) is { } userId)
                    await DropAsync(userId);
                else
                    logger.LogWarning("Ignoring unreadable {Type} payload", message.Type);
                break;

            case SessionGrantsMessage.Type:
                await ApplyGrantsAsync(channel.ActiveGrantUserIds);
                break;
        }
    }

    private async Task DropAsync(int userId)
    {
        if (oauth.ClientId is not { } clientId)
            return;

        if (await tokens.DeleteAsync(userId, clientId, CancellationToken.None))
            logger.LogInformation("Dropped grant for user {UserId} revoked by the desktop", userId);
    }

    private async Task ApplyGrantsAsync(IReadOnlyList<int>? activeUserIds)
    {
        // null (nothing pushed yet, or the channel is down) is not the same as an empty
        // list ("the desktop holds no live grant for you"). Deleting on null would wipe
        // every stored token on a message we never received.
        if (activeUserIds is null || oauth.ClientId is not { } clientId)
            return;

        var dropped = await tokens.DeleteMissingAsync(clientId, activeUserIds, CancellationToken.None);
        if (dropped > 0)
        {
            logger.LogInformation(
                "Dropped {Count} grant(s) the desktop no longer recognizes", dropped);
        }
    }
}
