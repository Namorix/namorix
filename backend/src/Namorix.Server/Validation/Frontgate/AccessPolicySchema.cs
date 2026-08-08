using Namorix.Core.Validation;
using Namorix.Server.Models.Frontgate;

namespace Namorix.Server.Validation.Frontgate;

public class AccessPolicySchema : IValidationSchema
{
    public StringValidationRule Name => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 200,
        Trim = true,
    };

    public EnumValidateRule Type => new()
    {
        IsRequired = true,
        EnumType = typeof(AccessPolicyType),
    };

    public JsonValidationRule RulesJson => new()
    {
        IsRequired = true,
        MaxLength = 10000,
    };
}