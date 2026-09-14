using System.Text.Json;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

public static class DesktopConfigMessage
{
    public const string TypeConfigUpdate = "config-update";

    // First message the desktop writes on every accepted channel. It is a bare
    // liveness proof with no payload and no app logic behind it, so the addon can
    // open its availability gate on it without depending on any other feature
    // succeeding. Sent before the config push, which is best-effort.
    public const string TypeHandshake = "handshake";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static ShellMessage Handshake() => new() { Type = TypeHandshake };

    public static ShellMessage ConfigUpdate(string? desktopDomain) => new()
    {
        Type = TypeConfigUpdate,
        Payload = JsonSerializer.Serialize(new DesktopConfigPayload(desktopDomain), JsonOptions),
    };

    public static string? ParseDesktopDomain(string payload)
    {
        try
        {
            var parsed = JsonSerializer.Deserialize<DesktopConfigPayload>(payload, JsonOptions);
            return string.IsNullOrWhiteSpace(parsed?.DesktopDomain) ? null : parsed.DesktopDomain;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record DesktopConfigPayload(string? DesktopDomain);
}
