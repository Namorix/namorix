import {
  ApiError,
  ApiTrafficRoutes,
  getApiBaseUrl,
  type HttpMethods,
  nmxHttp,
} from "@namorix/core"

export interface TrafficEndpoint {
  id: number
  method: HttpMethods
  path: string
  label?: string
  addonId?: string
  isEnabled: boolean
  createdAt: string
}

export interface TrafficAddress {
  id: number
  ip: string
}

export interface TrafficLog {
  id: number
  endpointId: number
  statusCode: number
  durationMs: number
  responseSizeBytes: number
  trafficAddressId?: number
  userId?: number
  timestamp: string
  endpoint?: TrafficEndpoint
  trafficAddress?: TrafficAddress
}

export interface TrafficLogResponse {
  items: TrafficLog[]
  total: number
  elapsedMs: number
}

async function listLogs(
  page: number,
  size: number,
  search?: string,
): Promise<TrafficLogResponse> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiTrafficRoutes.logs)
    .query({ page, size, search })
    .get()
    .json<TrafficLogResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const trafficController = { listLogs }
