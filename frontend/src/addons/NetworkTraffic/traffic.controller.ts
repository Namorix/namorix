import {
  ApiError,
  ApiTrafficRoutes,
  getApiBaseUrl,
  http,
  type HttpMethod,
} from "@namorix/core"

export interface TrafficEndpoint {
  id: number
  method: HttpMethod
  path: string
  label?: string
  addonId?: string
  isEnabled: boolean
  createdAt: string
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
}

async function listEndpoints(): Promise<TrafficEndpoint[]> {
  const data = await http
    .url(getApiBaseUrl() + ApiTrafficRoutes.endpoints)
    .get()
    .json<TrafficEndpoint[]>()

  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const trafficController = { listEndpoints }
