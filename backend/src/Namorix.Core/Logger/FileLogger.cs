using Microsoft.Extensions.Logging;
using Namorix.Core.FlatFile;
using Namorix.Core.Infrastructure;

namespace Namorix.Core.Logger;

public class FileLogger(string categoryName, Func<LogLevel> minLevel) : ILogger
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => logLevel >= minLevel();
    private readonly string _logGroup = LogEntrySerializer.MapSourceToGroup(categoryName);

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
        Exception? exception, Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;
        var msg = exception != null ? $"{formatter(state, exception)}\n{exception}" : formatter(state, null);

        LogBuffer.Entries.Writer.TryWrite(new LogEntrySerializer
        {
            Level = logLevel,
            Source = categoryName,
            LogGroup = _logGroup,
            Message = msg,
            Timestamp = DateTime.UtcNow,
        });
    }
}