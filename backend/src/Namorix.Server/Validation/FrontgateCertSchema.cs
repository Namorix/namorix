using System.Text.RegularExpressions;
using Namorix.Core.Constants;
using Namorix.Core.Validation;
using Namorix.Server.Constants;

namespace Namorix.Server.Validation;

public class FrontgateCertSchema : IValidationSchema
{
    public CollectionValidationRule Domains => new()
    {
        ItemValidator = item =>
        {
            var domain = item as string;
            if (string.IsNullOrWhiteSpace(domain))
                return new ValidationResult(ValidationErrorCodes.Required, false, "domain");

            if (domain.StartsWith("*."))
                return new ValidationResult(FgErrorCodes.WildcardNotAllowed, false, "domain");

            return !DomainPattern.IsMatch(domain)
                ? new ValidationResult(ValidationErrorCodes.InvalidFormat, false, "domain")
                : new ValidationResult(null, true);
        },
    };

    public AllowedValuesValidationRule KeyType => new()
    {
        AllowedValues = ["rsa", "ecdsa"],
    };


    private static readonly Regex DomainPattern =
        new(@"^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])\.)+[a-zA-Z]{2,63}$",
            RegexOptions.Compiled);
}
