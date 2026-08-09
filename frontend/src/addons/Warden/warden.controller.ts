import {
  ApiError,
  ApiWardenRoutes,
  getApiBaseUrl,
  nmxHttp,
} from "@namorix/core"
import type {
  WdEventQuery,
  WdFirewallRule,
  WdSecurityEvent,
  WdSecurityProfile,
  WdSettings,
  WdStats,
  WdProtocol,
  WdRuleAction,
} from "./Warden.types"

export interface WdRulePayload {
  name: string
  sourceCidr?: string | null
  ports?: string | null
  protocol: WdProtocol
  action: WdRuleAction
  enabled?: boolean
  priority?: number | null
}

export interface WdSettingsPayload {
  firewallEnabled: boolean
  profile: WdSecurityProfile
  customThresholdFactor?: number
  customDurationFactor?: number
}

export interface WdEventListResponse {
  items: WdSecurityEvent[]
  total: number
}

async function listRules(): Promise<WdFirewallRule[]> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.rules)
    .get()
    .json<WdFirewallRule[]>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function createRule(payload: WdRulePayload): Promise<WdFirewallRule> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.rules)
    .post(payload)
    .json<WdFirewallRule>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateRule(
  id: number,
  payload: WdRulePayload,
): Promise<WdFirewallRule> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.ruleById(id))
    .put(payload)
    .json<WdFirewallRule>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function deleteRule(id: number): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.ruleById(id))
    .delete()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function toggleRule(id: number): Promise<WdFirewallRule> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.ruleToggle(id))
    .post()
    .json<WdFirewallRule>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function getSettings(): Promise<WdSettings> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.settings)
    .get()
    .json<WdSettings>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateSettings(payload: WdSettingsPayload): Promise<WdSettings> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.settings)
    .put(payload)
    .json<WdSettings>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function getStats(): Promise<WdStats> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.stats)
    .get()
    .json<WdStats>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listEvents(
  query: WdEventQuery = {},
): Promise<WdEventListResponse> {
  const params: Record<string, string | number | boolean> = {}
  if (query.page != null) params.page = query.page
  if (query.size != null) params.size = query.size
  if (query.ip) params.ip = query.ip
  if (query.type) params.type = query.type
  if (query.severity) params.severity = query.severity
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.events)
    .query(params)
    .get()
    .json<WdEventListResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function clearEvents(): Promise<{ deleted: number }> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiWardenRoutes.events)
    .delete()
    .json<{ deleted: number }>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const wardenController = {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getSettings,
  updateSettings,
  getStats,
  listEvents,
  clearEvents,
}
