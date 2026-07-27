using Microsoft.Extensions.Logging;

namespace Namorix.Core.FlatFile;

public class FlatFileOptions
{ 
    public LogLevel MinLogLevel { get; init; } = LogLevel.Information;
}