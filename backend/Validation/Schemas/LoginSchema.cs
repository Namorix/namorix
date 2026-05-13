using backend.Constants;

namespace backend.Validation.Schemas;

public class LoginSchema : IValidationSchema
{
    public StringValidationRule Username => new()
    {
        IsRequired = true,
        MinLength = AuthConstraints.UsernameMinLength,
        MaxLength = AuthConstraints.UsernameMaxLength,
        Trim = true
    };

    public StringValidationRule Password => new()
    {
        IsRequired = true,
        MinLength = AuthConstraints.PasswordMinLength
    };
}