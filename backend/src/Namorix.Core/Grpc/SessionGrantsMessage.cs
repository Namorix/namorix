using System.Text.Json;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

// Pushed by the desktop on every accepted channel, right after the handshake. It is the
// reconnect re-check: a revocation that happened while the addon was offline was broadcast
// to nobody, so the addon learns the current truth by comparing its stored grants against
// this list and dropping everything the desktop no longer recognizes.
public static class SessionGrantsMessage
{
    public const string Type = "session-grants";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static ShellMessage For(IEnumerable<int> userIds) => new()
    {
        Type = Type,
        Payload = JsonSerializer.Serialize(
            new SessionGrantsPayload(userIds.Distinct().ToArray()), JsonOptions),
    };

    // null means the payload could not be read. An empty list is a valid answer meaning
    // "the desktop holds no live grant for you" — the two must not be conflated, or a
    // malformed message would wipe every stored token.
    public static IReadOnlyList<int>? ParseUserIds(string payload)
    {
        try
        {
            var parsed = JsonSerializer.Deserialize<SessionGrantsPayload>(payload, JsonOptions);
            return parsed?.UserIds?.Where(id => id > 0).ToArray();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record SessionGrantsPayload(int[]? UserIds);
}
