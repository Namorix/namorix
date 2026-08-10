import {
  ApiAuthRoutes,
  ApiError,
  setUserStore,
  setAppearanceStore,
  type AppearanceSettings,
  ApiSettingsRoutes,
} from "@namorix/core"
import i18next from "i18next"
import { coreConfig } from "../config/coreConfig"

async function login(
  username: string,
  password: string,
  rememberMe?: boolean,
): Promise<void> {
  const data = await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiAuthRoutes.login)
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
  const data = await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiAuthRoutes.register)
    .post({ username, password, email, name })
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function logout(): Promise<void> {
  setUserStore(null)
  coreConfig.signalr.setHasBeenConnected(false)
  await coreConfig.signalr.stopConnection()
  const data = await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiAuthRoutes.logout)
    .post()
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function loadAppearance() {
  const res = await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiSettingsRoutes.appearanceMerged)
    .get()
    .json<AppearanceSettings>()

  if (!res.success) return

  setAppearanceStore(res.data)
  coreConfig.theme.applyAppearanceTokens(res.data)

  if (i18next.language !== res.data.appearance_language) {
    await i18next.changeLanguage(res.data.appearance_language)
  }

  if (res.data.appearance_theme) {
    await coreConfig.theme.applyTheme(res.data.appearance_theme)
  }
}

export const authController = { login, register, logout, loadAppearance }
