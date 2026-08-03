export const FrontgateErrorCodes: Record<string, string> = {
  FG_RULE_NOT_FOUND: "addon.frontgate.errors.ruleNotFound",
  FG_CERTIFICATE_NOT_FOUND: "addon.frontgate.errors.certificateNotFound",
  FG_CERTIFICATE_KEY_TOO_LARGE: "addon.frontgate.errors.certificateKeyTooLarge",
  FG_CERTIFICATE_TOO_LARGE: "addon.frontgate.errors.certificateTooLarge",
  FG_CERTIFICATE_INTERMEDIATE_TOO_LARGE:
    "addon.frontgate.errors.certificateIntermediateTooLarge",
  FG_DUPLICATE_SOURCE: "addon.frontgate.errors.duplicateSource",
  FG_INVALID_CERTIFICATE: "addon.frontgate.errors.invalidCertificate",
  FG_CERT_ALREADY_EXISTS: "addon.frontgate.errors.certificateAlreadyExists",
  FG_CERT_DOMAINS_REQUIRED: "addon.frontgate.errors.certificateDomainsRequired",
  FG_WILDCARD_NOT_ALLOWED: "addon.frontgate.errors.wildcardNotAllowed",
}

export type FrontgateCertificateKeyType = "rsa" | "ecdsa"
