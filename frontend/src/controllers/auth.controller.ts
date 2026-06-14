import {
  ApiAuthRoutes,
  ApiError,
  ApiUserRoutes,
  getApiBaseUrl,
  nmxHttp,
  stopConnection,
  setUserStore,
  setHasBeenConnected,
  setAppearanceStore,
  type AppearanceSettings,
  ApiSettingsRoutes,
  applyTheme,
  applyAppearanceTokens,
  AppearanceDefaults,
} from "@namorix/core"
import i18next from "i18next"

async function login(
  username: string,
  password: string,
  rememberMe?: boolean,
): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiAuthRoutes.login)
    .post({ username, password, rememberMe })
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function register(
  username: string,
  password: string,
  email: string,
  name: string,
): Promise<void> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiAuthRoutes.register)
    .post({ username, password, email, name })
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function logout(): Promise<void> {
  setUserStore(null)
  setHasBeenConnected(false)
  await stopConnection()
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiAuthRoutes.logout)
    .post()
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function loadAppearance() {
  const [sysRes, userRes] = await Promise.all([
    nmxHttp
      .url(ApiSettingsRoutes.appearanceSystem)
      .get()
      .json<AppearanceSettings>(),
    nmxHttp.url(ApiUserRoutes.settings).get().json<AppearanceSettings>(),
  ])

  if (sysRes.success && userRes.success) {
    const merged = { ...AppearanceDefaults, ...sysRes.data, ...userRes.data }

    setAppearanceStore(merged)
    applyAppearanceTokens(merged)

    if (i18next.language !== merged.appearance_language) {
      await i18next.changeLanguage(merged.appearance_language)
    }

    if (merged.appearance_theme) {
      await applyTheme(merged.appearance_theme)
    }
  }
}

export const authController = { login, register, logout, loadAppearance }
