import { ApiSettingsRoutes, getApiBaseUrl, http } from "@namorix/core"

export const settingsController = {
  async getAll(): Promise<{
    proxies: string[]
    origins: string[]
    registerEnabled: boolean
  }> {
    const res = await http
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
    const res = await http
      .url(getApiBaseUrl() + ApiSettingsRoutes.base)
      .put(data)
      .json()
    return res.success
  },
}
