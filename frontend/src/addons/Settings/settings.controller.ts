import {
  ApiError,
  ApiSettingsRoutes,
  ApiUserRoutes,
  getApiBaseUrl,
  nmxHttp,
} from "@namorix/core"
import type {
  NmxAccentColorData,
  NmxSegmentedGroupData,
  NmxSelectData,
} from "@namorix/ui"

export interface AppearanceOptionsResponse {
  accentColors: NmxAccentColorData[]
  fontFamilies: NmxSelectData[]
  densities: NmxSegmentedGroupData<string>[]
  fontSizes: NmxSegmentedGroupData<string>[]
  languages: NmxSelectData[]
  dateFormats: NmxSelectData[]
}

export const settingsController = {
  async getSystem(): Promise<{
    proxies: string[]
    origins: string[]
    registerEnabled: boolean
  }> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.system)
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

  async setSystem(data: {
    proxies: string[]
    origins: string[]
    registerEnabled: boolean
  }): Promise<boolean> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.system)
      .put(data)
      .json()
    return res.success
  },

  async getAppearanceOptions(): Promise<AppearanceOptionsResponse | null> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.appearanceOptions)
      .get()
      .json<AppearanceOptionsResponse>()
    return res.success ? res.data : null
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
