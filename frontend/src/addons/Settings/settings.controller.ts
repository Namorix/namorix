import {
  ApiError,
  ApiSettingsRoutes,
  ApiUserRoutes,
  getApiBaseUrl,
  nmxHttp,
} from "@namorix/core"

export const settingsController = {
  async getAll(): Promise<{
    proxies: string[]
    origins: string[]
    registerEnabled: boolean
  }> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.base)
      .get()
      .json<{
        proxies: string[]
        origins: string[]
        registerEnabled: boolean
      }>()
    return res.success
      ? res.data
      : { proxies: [], origins: [], registerEnabled: false }
  },

  async setAll(data: {
    proxies: string[]
    origins: string[]
    registerEnabled: boolean
  }): Promise<boolean> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.base)
      .put(data)
      .json()
    return res.success
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiUserRoutes.password)
      .put({ currentPassword, newPassword })
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
  },
}
