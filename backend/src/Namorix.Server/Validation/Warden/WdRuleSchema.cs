using Namorix.Core.Validation;
using Namorix.Server.Models.Warden;

namespace Namorix.Server.Validation.Warden;

public class WdRuleSchema : IValidationSchema
{
    public StringValidationRule Name => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 64,
        Trim = true,
    };

    public StringValidationRule SourceCidr => new()
    {
        MaxLength = 64,
        Trim = true,
    };

    public StringValidationRule Ports => new()
    {
        MaxLength = 128,
        Trim = true,
    };

    public EnumValidateRule Protocol => new()
    {
        EnumType = typeof(WdProtocol),
    };

    public EnumValidateRule Action => new()
    {
        EnumType = typeof(WdRuleAction),
    };
}