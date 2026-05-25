using Microsoft.Extensions.Logging;

namespace Namorix.Core.Logger;

public class FileLoggerProvider(Func<LogLevel> minLevel) : ILoggerProvider
{
    public ILogger CreateLogger(string categoryName) => new FileLogger(categoryName, minLevel);
    public void Dispose() { }
}