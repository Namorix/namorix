import type { AuthChecker } from "../router"
import { getApiBaseUrl } from "../config"
import { nmxHttp } from "../http"
import { ApiAuthRoutes } from "../apiRoutes"
import type { AuthStatus, User } from "../types"
import {
  setNeedsRegisterStore,
  setRegisterEnabledStore,
  setUserStore,
} from "../store"

async function getAuthStatus(): Promise<AuthStatus> {
  const data = await nmxHttp
    .url(getApiBaseUrl() + ApiAuthRoutes.status)
    .get()
    .json<AuthStatus>()

  if (!data.success) {
    throw new Error(data.error)
  }

  setRegisterEnabledStore(data.data.registerEnabled)
  setNeedsRegisterStore(data.data.needsRegister)
  return data.data
}

export const authService: AuthChecker = {
  isAuthenticated: async () => {
    const data = await nmxHttp
      .url(getApiBaseUrl() + ApiAuthRoutes.session)
      .get()
      .json<User>()

    setUserStore(data.success ? data.data : null)

    return data.success
  },

  checkHasUsers: async () => {
    const status = await getAuthStatus()
    return !status.needsRegister
  },

  isRegistrationOpen: async () => {
    const status = await getAuthStatus()
    return status.needsRegister || status.registerEnabled
  },
}
