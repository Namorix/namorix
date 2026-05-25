using Namorix.Core.FlatFile;

namespace Namorix.Core.IO;

public class DataDirectory(string basePath)
{
    private static readonly HashSet<string> KnownCategories = ["traffic", "logs"];

    public string BasePath => basePath;
    public string TrafficPath => Path.Combine(basePath, "traffic");
    public string LogsPath => Path.Combine(basePath, "logs");

    public void EnsureInitialized()
    {
        foreach (var cat in KnownCategories)
            Directory.CreateDirectory(Path.Combine(basePath, cat));
    }

    public void EnsureTrafficFiles() => Directory.CreateDirectory(TrafficPath);
    public void EnsureLogsFiles() => Directory.CreateDirectory(LogsPath);

    public DataDirectoryStats GetStats()
    {
        var cats = KnownCategories
            .Select(GetCategoryStats)
            .ToDictionary(s => s.Category);
        return new DataDirectoryStats(
            TotalFiles: cats.Values.Sum(c => c.FileCount),
            TotalSize: cats.Values.Sum(c => c.SizeBytes),
            Categories: cats
        );
    }

    public DataCategoryStats GetTrafficStats() => GetCategoryStats("traffic");
    public DataCategoryStats GetLogsStats() => GetCategoryStats("logs");
    
    public int PurgeTraffic(int retentionDays) => PurgeCategory("traffic", retentionDays);
    public int PurgeLogs(int retentionDays) => PurgeCategory("logs", retentionDays);

    private DataCategoryStats GetCategoryStats(string category)
    {
        var dir = Path.Combine(basePath, category);
        if (!Directory.Exists(dir))
            return new DataCategoryStats(category, 0, 0, null, null);

        var files = Directory.GetFiles(dir, "*.*", SearchOption.AllDirectories);
        var totalSize = files.Sum(f => new FileInfo(f).Length);
        var dates = files
            .Select(File.GetLastWriteTimeUtc)
            .ToList();

        return new DataCategoryStats(
            category,
            files.Length,
            totalSize,
            dates.Count > 0 ? dates.Min() : null,
            dates.Count > 0 ? dates.Max() : null
        );
    }

    public int PurgeCategory<T>(int retentionDays) where T : class, IFlatFileSerializer<T>
        => PurgeCategory(T.Category, retentionDays);
    
    public int PurgeCategory(string category, int retentionDays)
    {
        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);
        var catDir = Path.Combine(basePath, category);
        if (!Directory.Exists(catDir)) return 0;
        var deleted = 0;
        
        foreach (var file in Directory.GetFiles(catDir, LogPattern, SearchOption.AllDirectories))
        {
            var dateStr = DateFromFileName(file);
            if (!DateTime.TryParse(dateStr, out var fileDate)
                || fileDate >= cutoff) continue;
            
            File.Delete(file);
            deleted++;
        }
        return deleted;
    }
    
    public Task<int> PurgeAllAsync(DateTime cutoff)
    {
        var deleted = 0;
        if (!Directory.Exists(basePath)) return Task.FromResult(0);
        
        foreach (var catDir in Directory.GetDirectories(basePath))
        {
            foreach (var file in Directory.GetFiles(catDir, LogPattern, SearchOption.AllDirectories))
            {
                var dateStr = DateFromFileName(file);
                if (!DateTime.TryParse(dateStr, out var fileDate)
                    || fileDate >= cutoff) continue;
                
                File.Delete(file);
                deleted++;
            }
        }
        return Task.FromResult(deleted);
    }
    
    private static string LogPattern => "*.log";
    
    private static string DateFromFileName(string file)
    {
        var name = Path.GetFileNameWithoutExtension(file);
        return name.Length >= 10 ? name[^10..] : "";
    }
}

public record DataDirectoryStats(
    long TotalFiles,
    long TotalSize,
    Dictionary<string, DataCategoryStats> Categories
);

public record DataCategoryStats(
    string Category,
    long FileCount,
    long SizeBytes,
    DateTime? OldestFile,
    DateTime? NewestFile
);