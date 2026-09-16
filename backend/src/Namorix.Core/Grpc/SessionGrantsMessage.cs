using System.Text.Json;
using Namorix.Core.AddonSession;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

// Pushed by the desktop on every accepted channel, right after the handshake. It is the
// reconnect re-check: a revocation that happened while the addon was offline was broadcast
// to nobody, so the addon learns the current truth by comparing its stored sessions against
// this list and dropping everything the desktop no longer recognizes.
public static class SessionGrantsMessage
{
    public const string Type = "session-grants";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static ShellMessage For(IEnumerable<AddonSessionRef> sessions) => new()
    {
        Type = Type,
        Payload = JsonSerializer.Serialize(
            new SessionGrantsPayload(
                sessions.Select(s => new SessionPayload(s.UserId, s.SessionId)).ToArray()),
            JsonOptions),
    };

    // null means the payload could not be read. An empty list is a valid answer meaning
    // "the desktop holds no live session for you" — the two must not be conflated, or a
    // malformed message would wipe every stored token.
    public static IReadOnlyList<AddonSessionRef>? Parse(string payload)
    {
        SessionGrantsPayload? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<SessionGrantsPayload>(payload, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }

        if (parsed?.Sessions is not { } sessions)
            return null;

        var result = new List<AddonSessionRef>(sessions.Length);
        foreach (var session in sessions)
        {
            // A malformed entry is skipped rather than voiding the whole list: one bad row
            // must not be read as "nothing is live", which would drop every session.
            if (session is null || session.UserId <= 0 || string.IsNullOrEmpty(session.SessionId))
                continue;
            result.Add(new AddonSessionRef(session.UserId, session.SessionId));
        }

        return result;
    }

    private sealed record SessionGrantsPayload(SessionPayload?[]? Sessions);

    private sealed record SessionPayload(int UserId, string? SessionId);
}
