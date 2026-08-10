import { ApiError, ApiLogRoutes, type LogEntry } from "@namorix/core"
import { coreConfig } from "../../config/coreConfig"

export interface LogResponse {
  entries: LogEntry[]
  total: number
}

export const logController = {
  listLogs: async (
    page: number,
    size: number,
    levels?: string[],
    source?: string,
  ): Promise<LogResponse> => {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: size,
    }
    if (levels && levels.length > 0) params.levels = levels.join(",")
    if (source) params.source = source

    const data = await coreConfig.http
      .url(coreConfig.getApiBaseUrl() + ApiLogRoutes.logs)
      .query(params)
      .get()
      .json<LogResponse>()
    if (!data.success) throw ApiError.fromResponse(data)
    return data.data
  },
}
