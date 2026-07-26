import {
  ApiError,
  ApiFrontgateRoutes,
  getApiBaseUrl,
  nmxHttp,
} from "@namorix/core"

export type ReverseProxyRuleAccess =
  | "public"
  | "private"
  | "restricted"
  | "basicAuth"

export type ReverseProxyRuleStatus = "inactive" | "active" | "error"

export interface ReverseProxyRule {
  id: string
  source: string
  destinationScheme: string
  destinationHost: string
  destinationPort: number
  access: ReverseProxyRuleAccess
  status: ReverseProxyRuleStatus
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

export interface CertificateItem {
  id: string
  domain: string
  issuer: string
  type: string
  expiresAt: string
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

async function listCertificates(): Promise<CertificateItem[]> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiFrontgateRoutes.certificates)
    .get()
    .json<CertificateItem[]>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const frontgateController = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  listCertificates,
}
