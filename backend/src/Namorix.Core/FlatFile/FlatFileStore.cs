using System.Collections.Concurrent;
using Namorix.Core.IO;

namespace Namorix.Core.FlatFile;

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
    
    public async Task AppendAsync<T>(T entry, string? subDirectory) where T : class, IFlatFileSerializer<T>
    {
        var path = GetFilePath<T>(T.GetTimestamp(entry), subDirectory);
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

        var query = GetFilesForCategory<T>()
            .Reverse()
            .SelectMany(file => File.ReadLines(file).Reverse())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line => T.Deserialize(line, T.Category))
            .Where(entry => entry != null && (filter == null || filter(entry)))
            .Select(entry => (entry: entry!, ts: T.GetTimestamp(entry!)))
            .OrderByDescending(x => x.ts)
            .Skip(skip ?? 0);

        if (take.HasValue)
            query = query.Take(take.Value);

        foreach (var (entry, _) in query)
            yield return entry;
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
        foreach (var file in Directory.GetFiles(dir, "*.log", SearchOption.AllDirectories)
                     .OrderBy(f => f))
        {
            yield return file;
        }
    }
    
    private string GetFilePath<T>(DateTime timestamp, string? subDirectory) where T : class, IFlatFileSerializer<T>
    {
        var dir = string.IsNullOrEmpty(subDirectory)
            ? Path.Combine(_basePath, T.Category)
            : Path.Combine(_basePath, T.Category, subDirectory);
        var prefix = string.IsNullOrEmpty(subDirectory) ? T.Category : subDirectory;
        return Path.Combine(dir, $"{prefix}-{timestamp:yyyy-MM-dd}.log");
    }
}