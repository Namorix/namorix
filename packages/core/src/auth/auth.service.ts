import { ApiAuthRoutes, type AuthStatus } from "@namorix/shared"
import type { AuthChecker } from "../router"
import { getApiBaseUrl } from "../config"
import { http } from "../http"

async function getAuthStatus(): Promise<AuthStatus> {
  const data = await http
    .url(getApiBaseUrl() + ApiAuthRoutes.status)
    .get()
    .json<AuthStatus>()
  if (!data.success) {
    throw new Error(data.error)
  }
  return data.data
}

export const authService: AuthChecker = {
  isAuthenticated: async () => {
    const data = await http
      .url(getApiBaseUrl() + ApiAuthRoutes.session)
      .get()
      .json()
    return data.success
  },
  checkHasUsers: async () => {
    const status = await getAuthStatus()
    return !status.needsRegister
  },
  isRegistrationOpen: async () => {
    const status = await getAuthStatus()
    return status.registerEnabled
  },
}
