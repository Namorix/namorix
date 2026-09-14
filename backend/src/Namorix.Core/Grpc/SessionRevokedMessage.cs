using System.Text.Json;
using Namorix.Core.Protos;

namespace Namorix.Core.Grpc;

public static class SessionRevokedMessage
{
    public const string Type = "session-revoked";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    // userId is carried because the desktop broadcasts this to every connected addon,
    // and a payload without it would tell an addon running several users' sessions to
    // drop all of them. An addon must only drop the session whose userId matches.
    public static ShellMessage For(int userId) => new()
    {
        Type = Type,
        Payload = JsonSerializer.Serialize(new SessionRevokedPayload(userId), JsonOptions),
    };

    public static int? ParseUserId(string payload)
    {
        try
        {
            var parsed = JsonSerializer.Deserialize<SessionRevokedPayload>(payload, JsonOptions);
            return parsed is { UserId: > 0 } ? parsed.UserId : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record SessionRevokedPayload(int UserId);
}
