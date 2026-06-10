using Namorix.Core.Constants;
using Namorix.Core.Data;

namespace Namorix.Core.Validation.Schemas;

public class SetSettingsSchema : IValidationSchema
{
    public StringValidationRule AppearanceTheme => new()
    {
        IsRequired = true,
        MaxLength = 100,
    };
    
    public AllowedValuesValidationRule AppearanceAccentColor => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.AccentColors.Select(c => c.Id)]
    };
    
    public AllowedValuesValidationRule AppearanceDensity => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.Densities.Select(c => c.Value)]
    };

    public AllowedValuesValidationRule AppearanceCollapsed => new()
    {
        IsRequired = true,
        AllowedValues = [SettingValues.True, SettingValues.False]
    };
    
    public AllowedValuesValidationRule AppearanceFontFamily => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.FontFamilies.Select(c => c.Value)]
    };
    
    public AllowedValuesValidationRule AppearanceFontSize => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.FontSizes.Select(c => c.Value)]
    };
    
    public AllowedValuesValidationRule AppearanceLanguage => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.Languages.Select(c => c.Value)]
    };
    
    public AllowedValuesValidationRule AppearanceDateFormat => new()
    {
        IsRequired = true,
        AllowedValues = [.. AppearanceOptionsData.Default.DateFormats.Select(c => c.Value)]
    };
}