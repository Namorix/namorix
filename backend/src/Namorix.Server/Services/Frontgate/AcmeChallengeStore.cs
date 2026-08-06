using System.Collections.Concurrent;

namespace Namorix.Server.Services;

// Temporarily store HTTP-01 challenge: token → keyAuthorization (only exists while waiting for LE verification)
public class AcmeChallengeStore
{
    private readonly ConcurrentDictionary<string, string> _challenges = new();

    public void Add(string token, string keyAuthorization) =>
        _challenges[token] = keyAuthorization;

    public bool TryGet(string token, out string keyAuthorization) =>
        _challenges.TryGetValue(token, out keyAuthorization!);

    public void Remove(string token) =>
        _challenges.TryRemove(token, out _);
}