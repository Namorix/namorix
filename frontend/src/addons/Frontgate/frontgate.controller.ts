import {
  ApiError,
  ApiFrontgateRoutes,
  getApiBaseUrl,
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

export const frontgateController = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listCertificates,
  listAllCertificates,
  listUnusedDomains,
  deleteCertificate,
  createLetsEncryptCert,
  createCustomCert,
  testLetsEncryptHttp,
}
