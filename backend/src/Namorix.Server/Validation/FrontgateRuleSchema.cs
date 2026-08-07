using Namorix.Core.Constants;
using Namorix.Core.Validation;

namespace Namorix.Server.Validation;

public class FrontgateRuleSchema : IValidationSchema
{
    public FormatValidationRule Source => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 200,
        Trim = true,
        Pattern = @"^[\w.-]+$",
    };
    
    public FormatValidationRule DestinationHost => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 500,
        Trim = true,
        Pattern = @"^[\w.-]+$",
    };
    
    public AllowedValuesValidationRule DestinationScheme => new()
    {
        AllowedValues = ["http", "https"],
    };
    
    public StringValidationRule DestinationPort => new()
    {
        IsRequired = true,
        Min = 1,
        Max = 65535,
    };

    public AllowedValuesValidationRule Access => new()
    {
        IsRequired = true,
        AllowedValues = ["public", "private", "restricted", "basicAuth"],
    };
    
    public JsonValidationRule AdditionalHeadersJson => new()
    {
        MaxLength = 10000,
    };
    
    public CollectionValidationRule Locations => new()
    {
        ItemValidator = (item) =>
        {
            var path = item.GetType().GetProperty("Path")?.GetValue(item) as string;
            var forwardHost = item.GetType().GetProperty("ForwardHost")?.GetValue(item) as string;
            var forwardPort = item.GetType().GetProperty("ForwardPort")?.GetValue(item);
            
            if (string.IsNullOrWhiteSpace(path))
                return new ValidationResult(ValidationErrorCodes.Required, false, "path");
            
            if (string.IsNullOrWhiteSpace(forwardHost))
                return new ValidationResult(ValidationErrorCodes.Required, false, "forwardHost");
            
            if (forwardPort is not int port || port < 1 || port > 65535)
                return new ValidationResult(ValidationErrorCodes.OutOfRange, false, "forwardPort");
            
            return new ValidationResult(null, true);
        },
    };
}