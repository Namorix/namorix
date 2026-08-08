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
    public const string CertificateAlreadyExists = "FG_CERTIFICATE_ALREADY_EXISTS";
    public const string CertificateDomainsRequired = "FG_CERTIFICATE_DOMAINS_REQUIRED";
    public const string WildcardNotAllowed = "FG_WILDCARD_NOT_ALLOWED";
    public const string CertificateNotRetriable = "FG_CERTIFICATE_NOT_RETRIABLE";
    public const string PolicyInUse = "FG_POLICY_IN_USE";
    public const string PolicyNotFound = "FG_POLICY_NOT_FOUND";
    public const string PolicyRequired = "FG_POLICY_REQUIRED";
    public const string PolicyTypeMismatch = "FG_POLICY_TYPE_MISMATCH";
    public const string PolicyLocksOutAdmin = "FG_POLICY_LOCKS_OUT_ADMIN";
    public const string DryRunNotPending = "FG_DRY_RUN_NOT_PENDING";
    public const string CertificateFilesMissing = "FG_CERTIFICATE_FILES_MISSING";
}

public enum FgRuleAction { Created, Updated, Deleted }
public enum FgDryRunAction { Confirm, Cancel, Expire }
public enum FgCertAction { Created, Updated, Deleted }
