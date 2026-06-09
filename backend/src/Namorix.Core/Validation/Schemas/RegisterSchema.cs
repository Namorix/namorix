using Namorix.Core.Constants;

namespace Namorix.Core.Validation.Schemas;

public class RegisterSchema : LoginSchema
{
    public FormatValidationRule Email => new()
    {
        IsRequired = true,
        MaxLength = AuthConstraints.EmailMaxLength,
        Pattern = AuthConstraints.EmailPattern
    };

    public StringValidationRule Name => new()
    {
        IsRequired = true,
        MinLength = AuthConstraints.NameMinLength,
        MaxLength = AuthConstraints.NameMaxLength,
        Trim = true
    };
}