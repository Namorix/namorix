import {
  ApiError,
  ApiSettingsRoutes,
  ApiThemeRoutes,
  ApiUserRoutes,
  type AppearanceSettings,
  getApiBaseUrl,
  nmxHttp,
  type ThemeManifest,
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
  timeFormats: NmxSelectData[]
  dateFormats: NmxSelectData[]
}

export const settingsController = {
  async getUserSettings(): Promise<Record<string, string>> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiUserRoutes.settings)
      .get()
      .json<Record<string, string>>()
    return res.success ? res.data : {}
  },

  async saveUserSettings(settings: AppearanceSettings): Promise<void> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiUserRoutes.settings)
      .put(settings)
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
  },

  async setAppearanceDefaults(settings: AppearanceSettings): Promise<void> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiSettingsRoutes.appearanceSystem)
      .put(settings)
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
  },

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

  async updateProfile(email: string, name: string): Promise<void> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiUserRoutes.profile)
      .put({ email, name })
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
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

  async getThemes(): Promise<ThemeManifest[]> {
    const res = await nmxHttp
      .url(getApiBaseUrl() + ApiThemeRoutes.themes)
      .get()
      .json<ThemeManifest[]>()

    return res.success ? res.data : []
  },
}
