import { ApiError, getApiBaseUrl, http } from "@namorix/core"
import { ApiAuthRoutes } from "@namorix/shared"

async function signUp(username: string, password: string): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.signup)
    .post({ username, password })
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

async function signIn(
  username: string,
  password: string,
  rememberMe?: boolean,
): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.signin)
    .post({ username, password, rememberMe })
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

async function signOut(): Promise<void> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.signout)
    .post()
    .json<void>()
  if (!data.success) {
    throw ApiError.fromResponse(data)
  }
}

export const authController = { signUp, signIn, signOut }
