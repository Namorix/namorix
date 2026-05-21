import {
  ApiAuthRoutes,
  ApiError,
  ApiUserRoutes,
  getApiBaseUrl,
  http,
  NMX_THEME_STORAGE_KEY,
  stopConnection,
} from "@namorix/core"

async function login(
  username: string,
  password: string,
  rememberMe?: boolean,
): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.login)
    .post({ username, password, rememberMe })
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)

  const themeRes = await http
    .url(getApiBaseUrl() + ApiUserRoutes.theme)
    .get()
    .json<{ themeId: string }>()
  if (themeRes.success && themeRes.data) {
    localStorage.setItem(NMX_THEME_STORAGE_KEY, themeRes.data.themeId)
  }
}

async function register(username: string, password: string): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.register)
    .post({ username, password })
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

async function logout(): Promise<void> {
  await stopConnection()
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.logout)
    .post()
    .json<void>()
  if (!data.success) throw ApiError.fromResponse(data)
}

export const authController = { login, register, logout }
