using Grpc.Core;
using Namorix.Core.Protos;
using Namorix.Server.Infrastructure;

namespace Namorix.Server.Services.Grpc;

public class AddonChannelService(AddonChannelManager manager, OAuthService oauth,
    IAddonNotifier notifier, ILogger<AddonChannelService> logger) : AddonChannel.AddonChannelBase
{
    public override async Task Connect(
        IAsyncStreamReader<AddonMessage> requestStream,
        IServerStreamWriter<ShellMessage> responseStream,
        ServerCallContext context)
    {
        var authHeader = context.RequestHeaders.Get("authorization")?.Value;
        if (authHeader == null || !authHeader.StartsWith("Bearer "))
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Missing token"));

        var token = authHeader["Bearer ".Length..];
        var addonId = await oauth.ValidateTokenAsync(token);
        if (addonId == null)
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid token"));

        logger.LogInformation("Addon {AddonId} connected via gRPC", addonId);
        using var cts = new CancellationTokenSource();
        var ctx = manager.Register(addonId, cts);
        ctx.ResponseStream = responseStream;

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
                // Gửi heartbeat-ack lại
                // Dùng ctx.ResponseStream từ ChannelManager
                break;
        }
    }
}