namespace Namorix.Core.Config;

public class AddonCatalogConfig
{
    public string CatalogUrl { get; init; } = "";
    public int TtlSeconds { get; init; } = 3600;
    public int SyncIntervalSeconds { get; init; } = 3600;
    public int RetryDelaySeconds { get; init; } = 60;

}