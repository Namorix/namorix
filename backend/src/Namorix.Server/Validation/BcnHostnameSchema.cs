using Namorix.Core.Validation;

namespace Namorix.Server.Validation;

public class BcnHostnameSchema : IValidationSchema
{
    public FormatValidationRule Host => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 253,
        Trim = true,
        Pattern = @"^(@|\*|(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9.-]{0,61}[a-zA-Z0-9])?)(,(@|\*|(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9.-]{0,61}[a-zA-Z0-9])?))*$",
    };
    
    public FormatValidationRule Domain => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 253,
        Trim = true,
        Pattern = @"^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$",
    };

    public FormatValidationRule ProviderId => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 32,
        Trim = true,
        Pattern = @"^[\w-]+$",
    };

    public AllowedValuesValidationRule Kind => new()
    {
        AllowedValues = ["get", "rest"],
    };

    public JsonValidationRule ConfigJson => new()
    {
        MaxLength = 10000,
    };
}

public class BcnHostnameTestSchema : IValidationSchema
{
    public FormatValidationRule ProviderId => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 32,
        Trim = true,
        Pattern = @"^[\w-]+$",
    };

    public AllowedValuesValidationRule Kind => new()
    {
        AllowedValues = ["get", "rest"],
    };

    public JsonValidationRule ConfigJson => new()
    {
        MaxLength = 10000,
    };
}