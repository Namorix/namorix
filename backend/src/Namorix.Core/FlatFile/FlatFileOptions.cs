using Microsoft.Extensions.Logging;

namespace Namorix.Core.FlatFile;

public class FlatFileOptions
{
    public string BasePath { get; init; } = "data";
    public LogLevel MinLogLevel { get; init; } = LogLevel.Information;
}