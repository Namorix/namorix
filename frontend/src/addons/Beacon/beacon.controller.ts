import {
  ApiError,
  ApiBeaconRoutes,
  getApiBaseUrl,
  nmxHttp,
} from "@namorix/core"
import type {
  BcnActivityPage,
  BcnHostnameDto,
  BcnHostnamePage,
  BcnProviderInfo,
  BcnSettingsDto,
  BcnStatusDto,
} from "./Beacon.types"
import type { BcnProviderKind } from "./Beacon.types"

export interface CreateHostnamePayload {
  hostname: string
  providerId: string
  kind: BcnProviderKind
  configJson?: string
}

export interface UpdateSettingsPayload {
  checkIntervalMinutes: number
  heartbeatIntervalHours: number
  ipDetectionService: string
  updateIpv6: boolean
}

export interface TestProviderResult {
  success: boolean
  code?: string
  params?: Record<string, unknown>
}

export interface CheckHostnameResult {
  success: boolean
  code?: string
  params?: Record<string, unknown>
}

async function listHostnames(
  page: number,
  size: number,
): Promise<BcnHostnamePage> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnames)
    .query({ page, size })
    .get()
    .json<BcnHostnamePage>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function createHostname(
  payload: CreateHostnamePayload,
): Promise<BcnHostnameDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnames)
    .post(payload)
    .json<BcnHostnameDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateHostname(
  id: string,
  payload: CreateHostnamePayload,
): Promise<BcnHostnameDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnameById(id))
    .put(payload)
    .json<BcnHostnameDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function deleteHostname(id: string): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnameById(id))
    .delete()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function testProvider(
  payload: CreateHostnamePayload,
): Promise<TestProviderResult> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnameTest)
    .post(payload)
    .json<TestProviderResult>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listActivity(
  page: number,
  size: number,
): Promise<BcnActivityPage> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.activity)
    .query({ page, size })
    .get()
    .json<BcnActivityPage>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function clearActivity(): Promise<{ deleted: number }> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.activity)
    .delete()
    .json<{ deleted: number }>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function listProviders(): Promise<BcnProviderInfo[]> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.providers)
    .get()
    .json<BcnProviderInfo[]>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function getSettings(): Promise<BcnSettingsDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.settings)
    .get()
    .json<BcnSettingsDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function updateSettings(
  payload: UpdateSettingsPayload,
): Promise<BcnSettingsDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.settings)
    .put(payload)
    .json<BcnSettingsDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function getStatus(): Promise<BcnStatusDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.status)
    .get()
    .json<BcnStatusDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function toggleHostname(id: string): Promise<BcnHostnameDto> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnameToggle(id))
    .post()
    .json<BcnHostnameDto>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function checkHostname(id: string): Promise<CheckHostnameResult> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.hostnameCheck(id))
    .post()
    .json<CheckHostnameResult>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

async function refreshHostnames(): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiBeaconRoutes.refresh)
    .post()
    .json()
  if (!data.success) throw ApiError.fromResponse(data)
}

export const beaconController = {
  listHostnames,
  createHostname,
  updateHostname,
  deleteHostname,
  testProvider,
  listActivity,
  clearActivity,
  listProviders,
  getSettings,
  updateSettings,
  getStatus,
  toggleHostname,
  checkHostname,
  refreshHostnames,
}
