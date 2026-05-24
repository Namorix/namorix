using System.Collections.Concurrent;
using Namorix.Core.FlatFile;
using Namorix.Core.IO;

namespace Namorix.Adapters.FlatFile;

public class FlatFileStore(FlatFileOptions options) : IFlatFileStore
{
    private readonly string _basePath = options.BasePath;
    private readonly DataDirectory _dataDir = new(options.BasePath);
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    private string GetFilePath<T>(DateTime timestamp) where T : class, IFlatFileSerializer<T>
    {
        var dir = Path.Combine(_basePath, T.Category);
        return Path.Combine(dir, $"{T.Category}-{timestamp:yyyy-MM-dd}.log");
    }
    
    public async Task AppendAsync<T>(T entry) where T : class, IFlatFileSerializer<T>
    {
        var path = GetFilePath<T>(T.GetTimestamp(entry));
        var dir = Path.GetDirectoryName(path)!;
        Directory.CreateDirectory(dir);

        var semaphore = _locks.GetOrAdd(path, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        try
        {
            var line = T.Serialize(entry);
            await File.AppendAllTextAsync(path, line + "\n");
        }
        finally
        {
            semaphore.Release();
        }
    }

    public async IAsyncEnumerable<T> QueryAsync<T>(
        Func<T, bool>? filter = null, int? skip = null, int? take = null)
        where T : class, IFlatFileSerializer<T>
    {
        await Task.Yield();
        
        var files = GetFilesForCategory<T>().Reverse(); // newest first
        var skipped = 0;
        var taken = 0;

        foreach (var file in files)
        {
            if (taken >= take) yield break;

            foreach (var line in File.ReadLines(file).Reverse())
            {
                if (string.IsNullOrWhiteSpace(line)) continue;

                var entry = T.Deserialize(line, T.Category);
                if (entry == null) continue;
                if (filter != null && !filter(entry)) continue;

                if (skip.HasValue && skipped < skip.Value)
                {
                    skipped++;
                    continue;
                }

                yield return entry;
                taken++;

                if (taken >= take) yield break;
            }
        }
    }

    public async Task<long> CountAsync<T>(Func<T, bool>? filter = null)
        where T : class, IFlatFileSerializer<T>
    {
        var count = 0L;
        await foreach (var _ in QueryAsync(filter))
            count++;
        return count;
    }

    public Task<int> DeleteBeforeAsync(DateTime cutoff)
    {
        return _dataDir.PurgeAllAsync(cutoff);
    }

    private IEnumerable<string> GetFilesForCategory<T>() where T : class, IFlatFileSerializer<T>
    {
        var dir = Path.Combine(_basePath, T.Category);
        if (!Directory.Exists(dir)) yield break;
        foreach (var file in Directory.GetFiles(dir, "*.log").OrderBy(f => f))
            yield return file;
    }
}