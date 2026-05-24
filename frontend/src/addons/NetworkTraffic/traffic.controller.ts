import {
  ApiError,
  ApiTrafficRoutes,
  getApiBaseUrl,
  type HttpMethods,
  nmxHttp,
} from "@namorix/core"

export interface TrafficLog {
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
