import {
  ApiAuthRoutes,
  ApiError,
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
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiSettingsRoutes.appearanceMerged)
    .get()
    .json<AppearanceSettings>()

  if (!res.success) return

  setAppearanceStore(res.data)
  applyAppearanceTokens(res.data)

  if (i18next.language !== res.data.appearance_language) {
    await i18next.changeLanguage(res.data.appearance_language)
  }

  if (res.data.appearance_theme) {
    await applyTheme(res.data.appearance_theme)
  }
}

export const authController = { login, register, logout, loadAppearance }
