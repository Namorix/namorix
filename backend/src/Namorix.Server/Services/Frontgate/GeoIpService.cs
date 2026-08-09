using System.Net;
using MaxMind.GeoIP2;
using Namorix.Core.IO;

namespace Namorix.Server.Services.Frontgate;

public class GeoIpService(IConfiguration config, DataDirectory dataDir)
{
    private readonly string _dbPath = ResolvePath(config["Frontgate:GeoIpDatabasePath"] ?? "GeoLite2-Country.mmdb", dataDir);
    private readonly Lock _lock = new();
    private DatabaseReader? _reader;

    private static string ResolvePath(string configured, DataDirectory dataDir) =>
        Path.IsPathRooted(configured) ? configured : Path.Combine(dataDir.BasePath, configured);

    private DatabaseReader GetReader()
    {
        if (_reader is not null)
            return _reader;
        
        lock (_lock)
        {
            if (_reader is not null)
                return _reader;
            
            _reader = new DatabaseReader(_dbPath);
            return _reader;
        }
    }

    public string? GetCountryCode(IPAddress ip)
    {
        try
        {
            return GetReader().Country(ip).Country.IsoCode;
        }
        catch
        {
            return null;
        }
    }
    
    public GeoIpStatus GetStatus()
    {
        var current = ReadMeta(new FileInfo(_dbPath));
        if (current is null)
            return new GeoIpStatus(false, 0, null, null, null, null);

        var backup = ReadMeta(new FileInfo(_dbPath + ".bak"));
        return new GeoIpStatus(
            true, current.FileSize, current.ModifiedAt,
            current.DatabaseType, current.BuildEpoch, current.MajorVersion,
            backup is not null,
            backup?.FileSize, backup?.DatabaseType, backup?.BuildEpoch);
    }

    private static GeoDbMeta? ReadMeta(FileInfo fi)
    {
        if (!fi.Exists) return null;
        try
        {
            using var reader = new DatabaseReader(fi.FullName);
            var meta = reader.Metadata;
            return new GeoDbMeta(fi.Length, fi.LastWriteTimeUtc,
                meta.DatabaseType, meta.BuildDate, meta.BinaryFormatMajorVersion);
        }
        catch
        {
            return new GeoDbMeta(fi.Length, fi.LastWriteTimeUtc, null, null, null);
        }
    }

    private sealed record GeoDbMeta(long FileSize, DateTime ModifiedAt,
        string? DatabaseType, DateTime? BuildEpoch, int? MajorVersion);
    
    public bool TryUpdateDatabase(Stream stream, out string? error)
    {
        error = null;
        try
        {
            using var ms = new MemoryStream();
            stream.CopyTo(ms);
            ms.Position = 0;
            using var probe = new DatabaseReader(ms);
            _ = probe.Metadata;
            ms.Position = 0;
            
            lock (_lock)
            {
                if (File.Exists(_dbPath))
                    File.Copy(_dbPath, _dbPath + ".bak", overwrite: true);
                File.WriteAllBytes(_dbPath, ms.ToArray());
                _reader = null;
            }            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }
    
    public bool RollbackDatabase(out string? error)
    {
        error = null;
        var bak = _dbPath + ".bak";
        if (!File.Exists(bak))
        {
            error = "No backup available";
            return false;
        }

        try
        {
            using var ms = File.OpenRead(bak);
            using var probe = new DatabaseReader(ms);
            _ = probe.Metadata;

            ms.Position = 0;
            lock (_lock)
            {
                File.Copy(bak, _dbPath, overwrite: true);
                File.Delete(bak); 
                _reader = null;
            }
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }
}

public record GeoIpStatus(
    bool Exists,
    long FileSize,
    DateTime? ModifiedAt,
    string? DatabaseType,
    DateTime? BuildEpoch,
    int? BinaryFormatMajorVersion,
    bool HasBackup = false,
    long? BackupFileSize = null,
    string? BackupDatabaseType = null,
    DateTime? BackupBuildEpoch = null);