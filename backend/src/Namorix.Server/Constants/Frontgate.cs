namespace Namorix.Server.Constants;

public static class FgErrorCodes
{
    public const string RuleNotFound = "FG_RULE_NOT_FOUND";
    public const string CertificateNotFound = "FG_CERTIFICATE_NOT_FOUND";
    public const string CertificateKeyToLarge = "FG_CERTIFICATE_KEY_TOO_LARGE";
    public const string CertificateTooLarge = "FG_CERTIFICATE_TOO_LARGE";
    public const string CertificateIntermediateTooLarge = "FG_CERTIFICATE_INTERMEDIATE_TOO_LARGE";
    public const string DuplicateSourceError = "FG_DUPLICATE_SOURCE";
    public const string InvalidCertificate = "FG_INVALID_CERTIFICATE";
    public const string CertificateAlreadyExists = "FG_CERT_ALREADY_EXISTS";
    public const string CertificateDomainsRequired = "FG_CERT_DOMAINS_REQUIRED";
    public const string WildcardNotAllowed = "FG_WILDCARD_NOT_ALLOWED";
}