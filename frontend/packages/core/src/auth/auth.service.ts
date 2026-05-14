import type { AuthChecker } from "../router"
import { getApiBaseUrl } from "../config"
import { http } from "../http"
import { ApiAuthRoutes} from "../api-routes"
import type { AuthStatus} from "../types"

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
