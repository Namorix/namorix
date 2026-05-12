import { ApiError, getApiBaseUrl, http } from "@namorix/core"
import { ApiAuthRoutes } from "@namorix/shared"

async function login(
  username: string,
  password: string,
  rememberMe?: boolean,
): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.login)
    .post({ username, password, rememberMe })
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

async function register(username: string, password: string): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.register)
    .post({ username, password })
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

async function logout(): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.logout)
    .post()
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

export const authController = { login, register, logout }
