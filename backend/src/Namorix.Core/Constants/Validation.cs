namespace Namorix.Core.Constants;

public class ValidationMeta
{
    public int? MinLength { get; init; }
    public int? MaxLength { get; init; }
    public int? Min { get; init; }
    public int? Max { get; init; }
    public string? Pattern { get; init; }
    public object[]? Enum { get; init; }
}