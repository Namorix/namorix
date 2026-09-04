import { ApiAboutRoutes, ApiError } from "@namorix/core"
import { coreConfig } from "../../config/coreConfig"

export interface AboutInfo {
  core: string
  server: string
}

export const aboutController = {
  async getInfo(): Promise<AboutInfo> {
    const res = await coreConfig.http
      .url(coreConfig.getApiBaseUrl() + ApiAboutRoutes.base)
      .get()
      .json<AboutInfo>()
    if (!res.success) throw ApiError.fromResponse(res)
    return res.data
  },
}
