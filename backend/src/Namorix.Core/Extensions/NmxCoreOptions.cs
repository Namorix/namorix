using Namorix.Core.Constants;

namespace Namorix.Core.Extensions;

public sealed class NmxCoreOptions
{
    public string? DataBasePath { get; set; } // null → fallback IOptions<AppConfig>
    public string HubPath { get; set; } = SignalRPath.HubNamorix;
}