using System.Text.RegularExpressions;
using Namorix.Core.Constants;

namespace Namorix.Core.Validation;

public record ValidationResult(
    string? ErrorCode,
    bool IsValid,
    string? FieldName = null,
    ValidationMeta? Meta = null);

public abstract class ValidationRule
{
    public bool IsRequired { get; init; } = false;
    public abstract ValidationResult Validate(string field, object? value, object? requestObj = null);

    protected static ValidationResult Fail(string code, string? field, ValidationMeta? meta = null) =>
        new(code, false, field, meta);
    protected static ValidationResult Pass() => new(null, true);
}

public class StringValidationRule : ValidationRule
{
    public int? MinLength { get; init; }
    public int? MaxLength { get; init; }
    public bool Trim { get; init; } = false;
    public int? Min{ get; init; }
    public int? Max{ get; init; }
    public string? MatchesField { get; init; }

    public override ValidationResult Validate(string field, object? value, object? requestObj = null)
    {
        if (value == null)
            return IsRequired ? Fail(ValidationErrorCodes.Required, field) : Pass();

        var str = value.ToString();

        if (Trim)
            str = str?.Trim();

        if (string.IsNullOrEmpty(str))
            return IsRequired ? Fail(ValidationErrorCodes.Required, field) : Pass();

        if (MinLength.HasValue && str?.Length < MinLength.Value)
            return Fail(ValidationErrorCodes.TooShort, field, new ValidationMeta { MinLength = MinLength.Value });
        
        if (MaxLength.HasValue && str?.Length > MaxLength.Value)
            return Fail(ValidationErrorCodes.TooLong, field, new ValidationMeta { MaxLength = MaxLength.Value });

        if (!Min.HasValue && !Max.HasValue)
            return Pass();

        if (value is not (int or long or double or float or decimal))
            return Fail(ValidationErrorCodes.InvalidType, field);
        
        var numericValue = Convert.ToDouble(value);
        if (numericValue < Min || numericValue > Max)
            return Fail(ValidationErrorCodes.OutOfRange, field, new ValidationMeta { Min = Min, Max = Max });

        if (MatchesField == null || requestObj == null)
            return Pass();
        
        var matchValue = requestObj.GetType().GetProperty(MatchesField)?.GetValue(requestObj);
        return value.ToString() != matchValue?.ToString()
            ? Fail(ValidationErrorCodes.Mismatch, field)
            : Pass();
    }
}

public class FormatValidationRule : ValidationRule
{
    public string Pattern { get; init; } = string.Empty;
    public int? MinLength { get; init; }
    public int? MaxLength { get; init; }

    public override ValidationResult Validate(string field, object? value, object? requestObj = null)
    {
        if (value is not string str || string.IsNullOrEmpty(str))
            return IsRequired ? Fail(ValidationErrorCodes.Required, field) : Pass();
        
        if (MinLength.HasValue && str.Length < MinLength.Value)
            return Fail(ValidationErrorCodes.TooShort, field, new ValidationMeta { MinLength = MinLength.Value });
        
        if (MaxLength.HasValue && str.Length > MaxLength.Value)
            return Fail(ValidationErrorCodes.TooLong, field, new ValidationMeta { MaxLength = MaxLength.Value });
        
        return !Regex.IsMatch(str, Pattern)
            ? Fail(ValidationErrorCodes.InvalidFormat, field, new ValidationMeta { Pattern = Pattern })
            : Pass();
    }
}

public class EnumValidateRule : ValidationRule
{
    public Type? EnumType { get; init; }

    public override ValidationResult Validate(string field, object? value, object? requestObj = null)
    {
        if (value == null)
            return IsRequired ? Fail(ValidationErrorCodes.Required, field) : Pass();

        if (EnumType == null)
            return Fail(ValidationErrorCodes.InvalidEnum, field);
        
        if (!Enum.IsDefined(EnumType, value))
            return Fail(ValidationErrorCodes.InvalidEnum, field,
                new ValidationMeta { Enum = Enum.GetNames(EnumType).Cast<object>().ToArray() });

        return Pass();
    }
}

public class AllowedValuesValidationRule : ValidationRule
{
    public string[] AllowedValues { get; init; } = [];
    public override ValidationResult Validate(string field, object? value, object? requestObj = null)
    {
        if (value is not string str || string.IsNullOrEmpty(str))
            return IsRequired ? Fail(ValidationErrorCodes.Required, field) : Pass();
        
        return Array.Exists(AllowedValues, v => v == str)
            ? Pass()
            : Fail(ValidationErrorCodes.InvalidOption, field,
                new ValidationMeta { AllowedValues = AllowedValues });
    }
}