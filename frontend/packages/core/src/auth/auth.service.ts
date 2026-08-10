import type { AuthChecker } from "../router"
import type { NmxCoreClient } from "../config"
import type { HttpService } from "../http"
import { ApiAuthRoutes } from "../apiRoutes"
import type { AuthStatus, User } from "../types"
import {
  setNeedsRegisterStore,
  setRegisterEnabledStore,
  setUserStore,
} from "../store"

export interface AuthServiceDeps {
  core: NmxCoreClient
  http: HttpService
}

export function createAuthService({
  core,
  http,
}: AuthServiceDeps): AuthChecker {
  async function getAuthStatus(): Promise<AuthStatus> {
    const data = await http
      .url(core.getApiBaseUrl() + ApiAuthRoutes.status)
      .get()
      .json<AuthStatus>()

    if (!data.success) {
      throw new Error(data.error)
    }

    setRegisterEnabledStore(data.data.registerEnabled)
    setNeedsRegisterStore(data.data.needsRegister)
    return data.data
  }

  return {
    isAuthenticated: async () => {
      const data = await http
        .url(core.getApiBaseUrl() + ApiAuthRoutes.session)
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
}
