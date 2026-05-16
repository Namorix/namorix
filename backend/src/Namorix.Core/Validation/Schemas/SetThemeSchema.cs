namespace Namorix.Core.Validation.Schemas;

public class SetThemeSchema: IValidationSchema
{
    public StringValidationRule ThemeId => new()
    {
        IsRequired = true,
        MaxLength = 100
    };
}