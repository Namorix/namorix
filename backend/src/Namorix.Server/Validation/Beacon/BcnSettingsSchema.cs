using Namorix.Core.Validation;

namespace Namorix.Server.Validation.Beacon;

public class BcnSettingsSchema : IValidationSchema
{
    public StringValidationRule CheckIntervalMinutes => new()
    {
        IsRequired = true,
        Min = 1,
        Max = 1440,
    };
    
    public StringValidationRule HeartbeatIntervalHours => new()
    {
        IsRequired = true,
        Min = 1,
        Max = 24,
    };

    public AllowedValuesValidationRule IpDetectionService => new()
    {
        AllowedValues = ["auto", "ipify.org"],
    };

    // UpdateIpv6 is bool — no rule required
}