import { ApiError, ApiTrafficRoutes, getApiBaseUrl, http } from "@namorix/core"

export interface TrafficStats {
  totalRequests: number
  errorCount: number
  avgDurationMs: number
  avgResponseSizeBytes: number
  statusCodes: Record<string, number>
  byEndpoint: EndpointStats[]
}

export interface EndpointStats {
  endpointId: number
  path: string
  method: string
  count: number
  avgDurationMs: number
  errorRate: number
}

export interface TrafficEndpoint {
  id: number
  method: string
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

async function getStats(from?: string, to?: string): Promise<TrafficStats> {
  const data = await http
    .url(getApiBaseUrl() + ApiTrafficRoutes.stats)
    .query({ from, to })
    .get()
    .json<TrafficStats>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
  return data.data
}

export const trafficController = { getStats }
