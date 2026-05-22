using Namorix.Core.Constants;

namespace Namorix.Core.Validation.Schemas;

public class ChangePasswordSchema : IValidationSchema
{
    public StringValidationRule CurrentPassword => new()
    {
        IsRequired = true
    };
    
    public StringValidationRule NewPassword => new()
    {
        IsRequired = true,
        MinLength = AuthConstraints.PasswordMinLength
    };
}