export const FrontgateErrorCodes = {
  RULE_NOT_FOUND: "addon.frontgate.errors.ruleNotFound",
  CERTIFICATE_NOT_FOUND: "addon.frontgate.errors.certificateNotFound",
  CERTIFICATE_KEY_TOO_LARGE: "addon.frontgate.errors.certificateKeyTooLarge",
  CERTIFICATE_TOO_LARGE: "addon.frontgate.errors.certificateTooLarge",
  CERTIFICATE_INTERMEDIATE_TOO_LARGE:
    "addon.frontgate.errors.certificateIntermediateTooLarge",
  DUPLICATE_SOURCE: "addon.frontgate.errors.duplicateSource",
  INVALID_CERTIFICATE: "addon.frontgate.errors.invalidCertificate",
}

export type FrontgateCertificateKeyType = "rsa" | "ecdsa"
