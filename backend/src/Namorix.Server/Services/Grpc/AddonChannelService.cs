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
        
        using var cts = new CancellationTokenSource();
        var ctx = manager.Register(addonId, cts);
        ctx.ResponseStream = responseStream;
        
        try
        {
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                context.CancellationToken, cts.Token);

            var recheckTask = RecheckLoopAsync(addonId, linkedCts.Token);

            await foreach (var message in requestStream.ReadAllAsync(linkedCts.Token))
                await HandleAddonMessageAsync(addonId, message);
            
            await recheckTask; // đợi recheck kết thúc
        }
        finally
        {
            manager.DisconnectAsync(addonId);
        }
    }
    
    private async Task RecheckLoopAsync(string addonId, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), ct);
            if (await oauth.IsAddonAuthorizedAsync(addonId))
                continue;
            
            logger.LogWarning("Addon {AddonId} bị revoke, đóng stream", addonId);
            throw new RpcException(new Status(StatusCode.PermissionDenied, "Addon revoked"));
        }
    }
    
    private async Task HandleAddonMessageAsync(string addonId, AddonMessage message)
    {
        switch (message.Type)
        {
            case "widget-event":
                // Forward qua SignalR cho frontend
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