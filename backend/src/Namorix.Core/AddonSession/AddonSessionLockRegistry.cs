using System.Collections.Concurrent;

namespace Namorix.Core.AddonSession;

// Serializes token refreshes per session id. A duplicated refresh presents an already-rotated
// refresh token, which the desktop reads as theft and answers by revoking the whole client chain,
// so the lock guards correctness rather than throughput.
//
// In-process only: it cannot coordinate several addon replicas. Phase 3 moves the lock to the
// desktop, keyed by (userId, clientId), which also covers the multi-replica case.
public sealed class AddonSessionLockRegistry
{
    private readonly ConcurrentDictionary<string, Entry> _entries = new();

    public async ValueTask<IAsyncDisposable> AcquireAsync(string key, CancellationToken ct)
    {
        Entry entry;
        while (true)
        {
            entry = _entries.GetOrAdd(key, static _ => new Entry());
            lock (entry)
            {
                if (entry.Removed)
                    continue;
                entry.Refs++;
                break;
            }
        }

        try
        {
            await entry.Gate.WaitAsync(ct);
        }
        catch
        {
            Release(key, entry, gateReleased: false);
            throw;
        }

        return new Handle(this, key, entry);
    }

    private void Release(string key, Entry entry, bool gateReleased = true)
    {
        if (gateReleased)
            entry.Gate.Release();

        var drop = false;
        lock (entry)
        {
            // The entry leaves the dictionary once the last holder is done, so dead session ids
            // do not accumulate. Not disposing the semaphore: a waiter may still hold a reference.
            if (--entry.Refs == 0)
            {
                entry.Removed = true;
                drop = true;
            }
        }

        if (drop)
            _entries.TryRemove(new KeyValuePair<string, Entry>(key, entry));
    }

    private sealed class Entry
    {
        public readonly SemaphoreSlim Gate = new(1, 1);
        public int Refs;
        public bool Removed;
    }

    private sealed class Handle(AddonSessionLockRegistry owner, string key, Entry entry) : IAsyncDisposable
    {
        private int _released;

        public ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _released, 1) == 0)
                owner.Release(key, entry);
            return ValueTask.CompletedTask;
        }
    }
}
