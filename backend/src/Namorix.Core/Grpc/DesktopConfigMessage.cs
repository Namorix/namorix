using System.Text.Json;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

public static class DesktopConfigMessage
{
    public const string TypeConfigUpdate = "config-update";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

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
