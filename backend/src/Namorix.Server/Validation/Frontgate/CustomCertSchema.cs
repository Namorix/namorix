using Namorix.Core.Validation;

namespace Namorix.Server.Validation.Frontgate;

public class CustomCertSchema : IValidationSchema
{
    public FormatValidationRule Name => new()
    {
        IsRequired = true,
        MinLength = 1,
        MaxLength = 200,
        Trim = true,
        Pattern = @"^[\w]+([.-][\w]+)*$",
    };

    public StringValidationRule CertificateKey => new()
    {
        IsRequired = true,
        MinLength = 1,
    };

    public StringValidationRule Certificate => new()
    {
        IsRequired = true,
        MinLength = 1,
    };
}