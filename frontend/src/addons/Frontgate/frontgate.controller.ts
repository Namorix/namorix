import {
  ApiError,
  ApiFrontgateRoutes,
  getApiBaseUrl,
  type HttpMethods,
  nmxHttp,
} from "@namorix/core"
import type { FrontgateCertificateKeyType } from "./Frontgate.types"

export type ReverseProxyRuleAccess =
  | "public"
  | "private"
  | "restricted"
  | "basicAuth"

export type ReverseProxyRuleStatus = "inactive" | "active" | "error"
export type ReverseCertificateStatus = "active" | "pending" | "error"
export type AccessPolicyType =
  | "ipAllowlist"
  | "geoBlock"
  | "basicAuth"
  | "ipDenylist"

export type AuditTargetType = "rule" | "cert" | "policy" | "audit"
export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "dryRunConfirm"
  | "dryRunCancel"
  | "dryRunExpire"
  | "certRetry"
  | "certRenew"
  | "auditCleared"

export interface ReverseProxyRule {
  id: string
  source: string
  destinationScheme: string
  destinationHost: string
  destinationPort: number
  access: ReverseProxyRuleAccess
  status: ReverseProxyRuleStatus
  createdAt: string
  certificateId?: string
  accessPolicyId?: string
  webSocketsSupport: boolean
  cacheAssets: boolean
  forceSsl: boolean
  certStatus?: ReverseCertificateStatus
  http2Support: boolean
  hstsEnabled: boolean
  hstsSubdomains: boolean
  trustForwardedProtoHeaders: boolean
  blockCommonExploits: boolean
  additionalHeadersJson?: string
  dryRunExpiresAt?: string
  locations?: {
    path: string
    scheme: string
    forwardHost: string
    forwardPort: number
  }[]
  rateLimit?: number
  rateLimitWindowSec?: number
  isHealthy?: boolean | null
  lastHealthCheckAt?: string | null
}

export interface ReverseProxyRuleResponse {
  items: ReverseProxyRule[]
  total: number
}

export interface CreateReverseProxyRulePayload {
  source: string
  destinationScheme: string
  destinationHost: string
  destinationPort: number
  certificateId?: string
  accessPolicyId?: string
  access: ReverseProxyRuleAccess
  status: ReverseProxyRuleStatus
  webSocketsSupport: boolean
  cacheAssets: boolean
  forceSsl: boolean
  http2Support: boolean
  hstsEnabled: boolean
  hstsSubdomains: boolean
  trustForwardedProtoHeaders: boolean
  blockCommonExploits: boolean
  additionalHeadersJson?: string
  locations?: {
    path: string
    scheme: string
    forwardHost: string
    forwardPort: number
  }[]
  requestCert?: boolean
  dryRun?: boolean
  dryRunMinutes?: number
  rateLimit?: number
  rateLimitWindowSec?: number
}

export interface CreateLetsEncryptCertPayload {
  domains: string[]
  keyType: FrontgateCertificateKeyType
  autoRenew: boolean
}

export interface CreateCustomCertPayload {
  name: string
  certificateKey: string
  certificate: string
  intermediate?: string
}

export interface CertificateItem {
  id: string
  domains: string[]
  issuer: string
  type: FrontgateCertificateKeyType
  source: string
  createdAt: string
  expiresAt: string
  status: ReverseCertificateStatus
  isInUse?: boolean
}

export interface CertificateResponse {
  items: CertificateItem[]
  total: number
}

export interface DryRunWarning {
  domain: string
  resolvedIps: string[]
  serverIp?: string
}

export interface LetsEncryptDryRunResult {
  passed: boolean
  message?: string
  warnings: DryRunWarning[]
}

export interface AccessPolicy {
  id: string
  name: string
  type: AccessPolicyType
  rulesJson: string
  createdAt: string
}

export interface CreateAccessPolicyPayload {
  name: string
  type: AccessPolicyType
  rulesJson: string
}

export interface AuditLogItem {
  id: number
  timestamp: string
  actor: string
  actorId?: string
  clientIp?: string
  targetType: AuditTargetType
  targetId?: string
  targetName?: string
  action: AuditAction
  beforeJson?: string
  afterJson?: string
}
export interface AuditLogResponse {
  items: AuditLogItem[]
  total: number
}

export interface FgTrafficLog {
  id: number
  method: HttpMethods
  path: string
  statusCode: number
  durationMs: number
  responseSizeBytes: number
  ip?: string
  userId?: number
  timestamp: string
}
export interface FgTrafficLogResponse {
  items: FgTrafficLog[]
  total: number
  elapsedMs: number
}

export interface GeoIpStatus {
  exists: boolean
  fileSize: number
  modifiedAt?: string | null
  databaseType?: string | null
  buildEpoch?: string | null
  binaryFormatMajorVersion?: number | null
  hasBackup: boolean
  backupFileSize?: number | null
  backupDatabaseType?: string | null
  backupBuildEpoch?: string | null
}

async function listRules(
  page: number,
  size: number,
): Promise<ReverseProxyRuleResponse> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxy)
    .query({ page, size })
    .get()
    .json<ReverseProxyRuleResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function createRule(
  payload: CreateReverseProxyRulePayload,
): Promise<ReverseProxyRule> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxy)
    .post(payload)
    .json<ReverseProxyRule>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateRule(
  id: string,
  payload: CreateReverseProxyRulePayload,
): Promise<ReverseProxyRule> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxyById(id))
    .put(payload)
    .json<ReverseProxyRule>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function deleteRule(id: string): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxyById(id))
    .delete()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function confirmDryRun(id: string): Promise<void> {
  await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxyDryRunConfirm(id))
    .post()
    .json()
}

async function cancelDryRun(id: string): Promise<void> {
  await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.reverseProxyDryRunCancel(id))
    .post()
    .json()
}

async function listCertificates(
  page: number,
  size: number,
): Promise<CertificateResponse> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificates)
    .query({ page, size })
    .get()
    .json<CertificateResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listAllCertificates(): Promise<CertificateResponse> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificatesAll)
    .get()
    .json<CertificateResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listUnusedDomains(): Promise<string[]> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificateUnusedDomains)
    .get()
    .json<string[]>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function deleteCertificate(id: string): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificateById(id))
    .delete()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function retryCertificate(id: string): Promise<void> {
  await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificateRetry(id))
    .post()
    .json()
}

async function renewCertificate(id: string): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificateRenew(id))
    .post()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function createLetsEncryptCert(
  payload: CreateLetsEncryptCertPayload,
): Promise<CertificateItem> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificatesLetsEncryptHttp)
    .post(payload)
    .json<CertificateItem>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function createCustomCert(
  payload: CreateCustomCertPayload,
): Promise<CertificateItem> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificatesCustom)
    .post(payload)
    .json<CertificateItem>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function testLetsEncryptHttp(
  domains: string[],
): Promise<LetsEncryptDryRunResult> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificatesLetsEncryptHttpDryRun)
    .post({ domains })
    .json<LetsEncryptDryRunResult>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listAccessPolicies(): Promise<AccessPolicy[]> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.accessPolicies)
    .get()
    .json<AccessPolicy[]>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function createAccessPolicy(
  payload: CreateAccessPolicyPayload,
): Promise<AccessPolicy> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.accessPolicies)
    .post(payload)
    .json<AccessPolicy>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateAccessPolicy(
  id: string,
  payload: CreateAccessPolicyPayload,
): Promise<AccessPolicy> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.accessPolicyById(id))
    .put(payload)
    .json<AccessPolicy>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function deleteAccessPolicy(id: string): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.accessPolicyById(id))
    .delete()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function listAudit(
  page: number,
  size: number,
): Promise<AuditLogResponse> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.audit)
    .query({ page, size })
    .get()
    .json<AuditLogResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function clearAudit(): Promise<{ deleted: number }> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.audit)
    .delete()
    .json<{ deleted: number }>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function downloadCert(id: string): Promise<void> {
  const url = getApiBaseUrl() + ApiFrontgateRoutes.certificateDownload(id)
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.rel = "noopener"
  a.click()
}

async function getGeoIpStatus(): Promise<GeoIpStatus> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.geoIp)
    .get()
    .json<GeoIpStatus>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function uploadGeoIp(
  formData: FormData,
  onProgress?: (progress: number) => void,
): Promise<GeoIpStatus> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.geoIp)
    .formUpload<GeoIpStatus>(formData, onProgress)
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function rollbackGeoIp(): Promise<GeoIpStatus> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.geoIpRollback)
    .post()
    .json<GeoIpStatus>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const frontgateController = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  confirmDryRun,
  cancelDryRun,
  listCertificates,
  listAllCertificates,
  listUnusedDomains,
  retryCertificate,
  renewCertificate,
  deleteCertificate,
  createLetsEncryptCert,
  createCustomCert,
  testLetsEncryptHttp,
  listAccessPolicies,
  createAccessPolicy,
  updateAccessPolicy,
  deleteAccessPolicy,
  listAudit,
  clearAudit,
  downloadCert,
  getGeoIpStatus,
  uploadGeoIp,
  rollbackGeoIp,
}
