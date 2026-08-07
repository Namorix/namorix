import type { ReverseCertificateStatus } from "./frontgate.controller"
import type { NmxSemanticColor } from "@namorix/ui"

export const FrontgateErrorCodes: Record<string, string> = {
  FG_RULE_NOT_FOUND: "addon.frontgate.errors.ruleNotFound",
  FG_CERTIFICATE_NOT_FOUND: "addon.frontgate.errors.certificateNotFound",
  FG_CERTIFICATE_KEY_TOO_LARGE: "addon.frontgate.errors.certificateKeyTooLarge",
  FG_CERTIFICATE_TOO_LARGE: "addon.frontgate.errors.certificateTooLarge",
  FG_CERTIFICATE_INTERMEDIATE_TOO_LARGE:
    "addon.frontgate.errors.certificateIntermediateTooLarge",
  FG_DUPLICATE_SOURCE: "addon.frontgate.errors.duplicateSource",
  FG_INVALID_CERTIFICATE: "addon.frontgate.errors.invalidCertificate",
  FG_CERTIFICATE_ALREADY_EXISTS:
    "addon.frontgate.errors.certificateAlreadyExists",
  FG_CERTIFICATE_DOMAINS_REQUIRED:
    "addon.frontgate.errors.certificateDomainsRequired",
  FG_CERTIFICATE_NOT_RETRIABLE:
    "addon.frontgate.errors.certificateNotRetriable",
  FG_WILDCARD_NOT_ALLOWED: "addon.frontgate.errors.wildcardNotAllowed",
  FG_POLICY_NOT_FOUND: "addon.frontgate.errors.policyNotFound",
  FG_POLICY_REQUIRED: "addon.frontgate.errors.policyRequired",
  FG_POLICY_TYPE_MISMATCH: "addon.frontgate.errors.policyTypeMismatch",
  FG_POLICY_IN_USE: "addon.frontgate.errors.policyInUse",
  FG_POLICY_LOCKS_OUT_ADMIN: "addon.frontgate.errors.policyLocksOutAdmin",
  FG_DRY_RUN_NOT_PENDING: "addon.frontgate.errors.dryRunNotPending",
}

export type FrontgateCertificateKeyType = "rsa" | "ecdsa"

export function getStatusSemantic(
  status: ReverseCertificateStatus | undefined,
  isInUse: boolean | undefined,
): NmxSemanticColor {
  return status === "pending"
    ? "warning"
    : status === "error"
      ? "error"
      : isInUse
        ? "success"
        : "trace"
}
