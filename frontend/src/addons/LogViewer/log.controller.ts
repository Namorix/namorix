import { ApiError, getApiBaseUrl, type LogEntry, nmxHttp } from "@namorix/core"

export interface LogResponse {
  entries: LogEntry[]
  total: number
}

export const logController = {
  listLogs: async (
    page: number,
    size: number,
    level?: string,
    source?: string,
  ): Promise<LogResponse> => {
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: size,
    }
    if (level) params.level = level
    if (source) params.source = source

    const data = await nmxHttp
      .url(getApiBaseUrl() + "/api/logs")
      .query(params)
      .get()
      .json<LogResponse>()
    if (!data.success) throw ApiError.fromResponse(data)
    return data.data
  },
}
