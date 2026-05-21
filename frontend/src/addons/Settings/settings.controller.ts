import { ApiSettingsRoutes, getApiBaseUrl, http } from "@namorix/core"

export const settingsController = {
  async getProxies(): Promise<string[]> {
    const res = await http
      .url(getApiBaseUrl() + ApiSettingsRoutes.proxies)
      .get()
      .json<string[]>()
    return res.success ? res.data : []
  },

  async setProxies(proxies: string[]): Promise<boolean> {
    const res = await http
      .url(getApiBaseUrl() + ApiSettingsRoutes.proxies)
      .put(proxies)
      .json()
    return res.success
  },

  async getOrigins(): Promise<string[]> {
    const res = await http
      .url(getApiBaseUrl() + ApiSettingsRoutes.origins)
      .get()
      .json<string[]>()
    return res.success ? res.data : []
  },

  async setOrigins(origins: string[]): Promise<boolean> {
    const res = await http
      .url(getApiBaseUrl() + ApiSettingsRoutes.origins)
      .put(origins)
      .json()
    return res.success
  },
}
