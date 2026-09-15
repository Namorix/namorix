using Grpc.Core;
using Namorix.Core.Constants;
using Namorix.Core.Grpc;
using Namorix.Core.Protos;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services.Grpc;

public class AddonChannelService(AddonChannelManager manager, OAuthService oauth,
    SettingsService settings, IAddonNotifier notifier, NmxAddonTokenSigner signer,
    ILogger<AddonChannelService> logger) : AddonChannel.AddonChannelBase
{
    public override async Task Connect(
        IAsyncStreamReader<AddonMessage> requestStream,
        IServerStreamWriter<ShellMessage> responseStream,
        ServerCallContext context)
    {
        var authHeader = context.RequestHeaders.Get("authorization")?.Value;
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
            throw InvalidClient("Missing token");

        var token = authHeader["Bearer ".Length..];
        var addonId = await oauth.ValidateTokenAsync(token);
        if (addonId == null)
            throw InvalidClient("Invalid token");

        logger.LogInformation("Addon {AddonId} connected via gRPC", addonId);
        using var cts = new CancellationTokenSource();
        var clientId = await oauth.GetClientIdAsync(addonId);
        var ctx = manager.Register(addonId, clientId ?? string.Empty, cts);
        ctx.ResponseStream = responseStream;

        // Sent unconditionally, before anything that can fail: the addon opens its
        // availability gate on this message, so it must not depend on another feature
        // succeeding. A failure here means the stream is unusable, so let it propagate.
        await responseStream.WriteAsync(DesktopConfigMessage.Handshake(), cts.Token);

        try
        {
            var desktopDomain = await settings.GetDesktopDomain();
            await responseStream.WriteAsync(DesktopConfigMessage.ConfigUpdate(desktopDomain), cts.Token);
        }
        catch
        {
            // Push is best-effort; the receive loop below still owns the stream lifecycle.
        }

        try
        {
            // Every (re)connect, so a revoke that happened while the addon was offline is
            // repaired here rather than waited on: that push reached nobody, and without
            // this the addon would keep a dead grant until its next refresh was refused.
            var activeUserIds = await oauth.GetActiveGrantUserIdsAsync(clientId ?? string.Empty);
            await responseStream.WriteAsync(SessionGrantsMessage.For(activeUserIds), cts.Token);
        }
        catch
        {
            // Same as above: best-effort. A missed list only delays the repair, it does not
            // leave the addon serving a revoked user — the channel-down gate covers that.
        }

        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            context.CancellationToken, cts.Token);

        var recheckTask = RecheckLoopAsync(addonId, linkedCts, linkedCts.Token);

        try
        {
            try
            {
                await foreach (var message in requestStream.ReadAllAsync(linkedCts.Token))
                    await HandleAddonMessageAsync(addonId, message);

                logger.LogInformation("Addon {AddonId} closed the stream", addonId);
            }
            catch (IOException)
            {
                logger.LogInformation("Addon {AddonId} disconnected (connection reset)", addonId);
            }
            catch (OperationCanceledException) when (cts.IsCancellationRequested)
            {
                logger.LogWarning("Addon {AddonId} disconnected by ChannelManager", addonId);
                throw new RpcException(new Status(StatusCode.Cancelled, "Addon disconnected"));
            }
            catch (OperationCanceledException)
            {
                logger.LogInformation("Addon {AddonId} connection cancelled", addonId);
            }
            finally
            {
                await linkedCts.CancelAsync();
            }

            try
            {
                await recheckTask;
            }
            catch (OperationCanceledException)
            {

            }
        }
        finally
        {
            manager.DisconnectAsync(addonId);
        }
    }

    public override async Task<OAuthTokenResult> ExchangeUserCode(
        ExchangeCodeRequest request, ServerCallContext context)
    {
        var clientId = await RequireAddonClientIdAsync(context);
        if (clientId != request.ClientId)
            throw Error(StatusCode.PermissionDenied, OAuthErrors.InvalidClient, "ClientId mismatch");

        var (tokenId, refreshToken, userId) = await oauth.ExchangeCodeAsync(
            request.Code, clientId, request.ClientAssertion, request.CodeVerifier);
        if (tokenId is null)
            throw new RpcException(new Status(StatusCode.InvalidArgument,
                "Authorization code is invalid or expired"));

        return new OAuthTokenResult
        {
            AccessToken = tokenId,
            RefreshToken = refreshToken,
            ExpiresIn = OAuth.AddonToken.AccessTokenTtlSeconds,
            UserId = userId,
        };
    }

    public override async Task<OAuthTokenResult> RefreshUserToken(
        RefreshTokenRequest request, ServerCallContext context)
    {
        var clientId = await RequireAddonClientIdAsync(context);
        if (clientId != request.ClientId)
            throw Error(StatusCode.PermissionDenied, OAuthErrors.InvalidClient, "ClientId mismatch");

        var result = await oauth.RefreshAddonTokenAsync(request.RefreshToken);
        if (result is null)
            throw Error(StatusCode.Unauthenticated, OAuthErrors.InvalidGrant,
                "Invalid refresh token");

        var (tokenId, newRefreshToken, userId, status) = result.Value;
        if (status == OAuthRefreshStatus.Reused)
            throw Error(StatusCode.Unauthenticated, OAuthErrors.TheftDetected,
                "Refresh token was reused. Possible theft detected. Re-registration required.");

        if (status != OAuthRefreshStatus.Ok || tokenId is null || newRefreshToken is null)
            throw Error(StatusCode.Unauthenticated, OAuthErrors.InvalidGrant,
                "Refresh token is expired or unknown");

        return new OAuthTokenResult
        {
            AccessToken = tokenId,
            RefreshToken = newRefreshToken,
            ExpiresIn = OAuth.AddonToken.AccessTokenTtlSeconds,
            UserId = userId,
        };
    }

    public override async Task<JwksResponse> GetJwks(JwksRequest request, ServerCallContext context)
    {
        // Authenticated like every other call on this channel. The key is reachable
        // only while the addon can reach the desktop — which is exactly when the
        // addon is allowed to serve.
        await RequireAddonClientIdAsync(context);

        var response = new JwksResponse();
        response.Keys.Add(new AddonSigningKey
        {
            Kid = signer.KeyId,
            PublicKeyPem = signer.PublicKeyPem,
        });
        return response;
    }

    public override async Task<RevokeGrantResponse> RevokeGrant(
        RevokeGrantRequest request, ServerCallContext context)
    {
        // clientId comes from the machine token, never from the payload. That is the whole
        // reason the request has no client_id field: an addon must not be able to revoke a
        // grant it does not own, whatever it claims.
        var clientId = await RequireAddonClientIdAsync(context);

        // 0 is the pre-Phase-1a backfill, which belongs to no user. Revoking it would be
        // revoking nothing while reporting success.
        if (request.UserId <= 0)
            throw new RpcException(new Status(StatusCode.InvalidArgument, "user_id must be a real user"));

        await oauth.RevokeGrantAsync((int)request.UserId, clientId);
        return new RevokeGrantResponse();
    }

    private async Task<string> RequireAddonClientIdAsync(ServerCallContext context)
    {
        var authHeader = context.RequestHeaders.Get("authorization")?.Value;
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
            throw InvalidClient("Missing token");

        var token = authHeader["Bearer ".Length..];
        var addonId = await oauth.ValidateTokenAsync(token);
        if (addonId is null)
            throw InvalidClient("Invalid token");

        var clientId = await oauth.GetClientIdAsync(addonId);
        return clientId ?? throw InvalidClient("Addon has no OAuth client");
    }

    private static RpcException InvalidClient(string message)
        => Error(StatusCode.Unauthenticated, OAuthErrors.InvalidClient, message);

    private static RpcException Error(StatusCode status, string errorCode, string message)
        => new(new Status(status, message),
            new Metadata { { OAuth.Trailer.ErrorCode, errorCode } });

    private async Task RecheckLoopAsync(string addonId, CancellationTokenSource linkedCts, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), ct);
            if (await oauth.IsAddonAuthorizedAsync(addonId))
                continue;

            logger.LogWarning("Addon {AddonId} revoked, closing stream", addonId);
            await linkedCts.CancelAsync();
            throw new RpcException(new Status(StatusCode.PermissionDenied, "Addon revoked"));
        }
    }

    private async Task HandleAddonMessageAsync(string addonId, AddonMessage message)
    {
        switch (message.Type)
        {
            case "widget-event":
                logger.LogInformation("[Addon {AddonId}] Widget event: {Payload}",
                    addonId, message.Payload);
                await notifier.NotifyAddonWidgetEvent(addonId, message.Payload);
                break;

            case "log":
                logger.LogInformation("[Addon {AddonId}] {Log}", addonId, message.Payload);
                break;

            case "heartbeat":
                // Send the heartbeat-ack back
                // via ctx.ResponseStream from ChannelManager
                break;
        }
    }
}