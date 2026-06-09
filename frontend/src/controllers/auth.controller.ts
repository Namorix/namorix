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
} from "@namorix/core"

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
  await loadAppearance()

  // const themeRes = await nmxHttp
  //   .url(getApiBaseUrl() + ApiUserRoutes.theme)
  //   .get()
  //   .json<{ themeId: string }>()
  // if (themeRes.success && themeRes.data) {
  //   localStorage.setItem(NMX_THEME_STORAGE_KEY, themeRes.data.themeId)
  // }
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
    .url(getApiBaseUrl() + ApiUserRoutes.settings)
    .get()
    .json<AppearanceSettings>()
  if (res.success && res.data) {
    setAppearanceStore(res.data)
  }
}

export const authController = { login, register, logout, loadAppearance }
