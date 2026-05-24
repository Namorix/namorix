namespace Namorix.Core.FlatFile;

public interface IFlatFileSerializer<T> where T : class
{
    static abstract string Serialize(T entry);
    static abstract T? Deserialize(string line, string category);
    static abstract string Category { get; }
    static abstract string Separator { get; }
    static abstract DateTime GetTimestamp(T entry);
}