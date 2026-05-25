using Microsoft.Extensions.Logging;
using Namorix.Core.FlatFile;

namespace Namorix.Core.Services;

public class LogService(IFlatFileStore flatFileStore)
{
    public IAsyncEnumerable<LogEntrySerializer> QueryAsync(LogFilter f)
        => flatFileStore.QueryAsync<LogEntrySerializer>(
            filter: e => Apply(e, f),
            skip: (f.Page - 1) * f.PageSize, take: f.PageSize);

    public Task<long> CountAsync(LogFilter f)
        => flatFileStore.CountAsync<LogEntrySerializer>(e => Apply(e, f));

    private static bool Apply(LogEntrySerializer e, LogFilter f) =>
        (!f.Level.HasValue || e.Level == f.Level) &&
        (string.IsNullOrEmpty(f.Source) || e.Source.Contains(f.Source, StringComparison.OrdinalIgnoreCase)) &&
        (!f.From.HasValue || e.Timestamp >= f.From) &&
        (!f.To.HasValue || e.Timestamp <= f.To);
}

public record LogFilter
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
    public LogLevel? Level { get; init; }
    public string? Source { get; init; }
    public DateTime? From { get; init; }
    public DateTime? To { get; init; }
}