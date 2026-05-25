namespace Namorix.Core.FlatFile;

public interface IFlatFileStore
{
    Task AppendAsync<T>(T entry) where T : class, IFlatFileSerializer<T>;
    Task AppendAsync<T>(T entry, string? subDirectory) where T : class, IFlatFileSerializer<T>;

    IAsyncEnumerable<T> QueryAsync<T>(
        Func<T, bool>? filter = null, int? skip = null, int? take = null)
        where T : class, IFlatFileSerializer<T>;

    Task<long> CountAsync<T>(Func<T, bool>? filter = null)
        where T : class, IFlatFileSerializer<T>;

    Task<int> DeleteBeforeAsync(DateTime cutoff);
}