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
}