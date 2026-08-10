import { ApiError, ApiTrafficRoutes, type HttpMethods } from "@namorix/core"
import { coreConfig } from "../../config/coreConfig"

export type TrafficSource = "api" | "proxy"

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
  source?: TrafficSource,
): Promise<TrafficLogResponse> {
  const data = await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiTrafficRoutes.logs)
    .query({ page, size, search, source })
    .get()
    .json<TrafficLogResponse>()
  if (!data.success) throw ApiError.fromResponse(data)
  return data.data
}

export const trafficController = { listLogs }
