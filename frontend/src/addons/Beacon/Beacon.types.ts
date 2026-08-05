export const BeaconActivityCodes: Record<string, string> = {
  BCN_UPDATED: "addon.beacon.activity.updated",
  BCN_PROBED: "addon.beacon.activity.probed",
}

export const BeaconErrorCodes: Record<string, string> = {
  BCN_RATE_LIMITED: "addon.beacon.activity.rateLimited",
  BCN_NO_IP: "addon.beacon.errors.noIp",
  BCN_INVALID_CREDENTIALS: "addon.beacon.errors.invalidCredentials",
  BCN_HOSTNAME_NOT_FOUND: "addon.beacon.errors.hostnameNotFound",
  BCN_ZONE_NOT_FOUND: "addon.beacon.errors.zoneNotFound",
  BCN_ACCOUNT_BLOCKED: "addon.beacon.errors.accountBlocked",
  BCN_UNAVAILABLE: "addon.beacon.errors.unavailable",
  BCN_PROVIDER_ERROR: "addon.beacon.errors.providerError",
  BCN_RECORD_NOT_FOUND: "addon.beacon.errors.recordNotFound",
  BCN_DUPLICATE_HOSTNAME: "addon.beacon.errors.duplicateHostname",
  BCN_CONFIG_INVALID: "addon.beacon.errors.configInvalid",
} as const

export type BcnProviderKind = "get" | "rest"
export type BcnHostnameStatus = "updating" | "active" | "disabled" | "error"
export type BcnLogLevel = "info" | "warn" | "error"

export interface BcnHostnameDto {
  id: string
  host: string
  domain: string
  providerId: string
  kind: BcnProviderKind
  configJson: string
  status: BcnHostnameStatus
  currentIpv4?: string
  currentIpv6?: string
  lastCheckedAt?: string
  lastUpdatedAt?: string
  lastError?: string
  backoffUntil?: string
  createdAt: string
}

export interface BcnHostnamePage {
  items: BcnHostnameDto[]
  total: number
}

export interface BcnActivityLogDto {
  id: number
  timestamp: string
  level: BcnLogLevel
  code?: string
  paramsJson?: string
  host?: string
  domain?: string
}

export interface BcnActivityPage {
  items: BcnActivityLogDto[]
  total: number
}

export interface BcnProviderCredentialField {
  key: string
  type: "text" | "secret"
  required: boolean
}

export interface BcnProviderInfo {
  id: string
  kind: BcnProviderKind
  credentialFields: BcnProviderCredentialField[]
  tested: boolean
  hostIsDomain: boolean
}

export interface BcnSettingsDto {
  checkIntervalMinutes: number
  heartbeatIntervalHours: number
  ipDetectionService: string
  updateIpv6: boolean
}

export interface BcnStatusDto {
  total: number
  healthy: number
  lastCheck?: string
}

export function bcnErrorDetail(params?: Record<string, unknown>): string {
  if (!params) return ""
  if (typeof params.detail === "string" && params.detail) return params.detail
  if (typeof params.httpStatus === "number" && params.httpStatus > 0)
    return `HTTP ${params.httpStatus}`
  return (params.reason as string) ?? ""
}
