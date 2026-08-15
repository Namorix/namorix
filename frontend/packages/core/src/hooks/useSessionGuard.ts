import { useEffect } from "react"
import { useIsStandalone } from "../mount"
import { HttpStatus } from "../types"
import { ApiOauthRoutes } from "../apiRoutes"

export interface SessionGuardOptions {
  statusUrl?: string
  loginUrl?: string
}

export function useSessionGuard(options: SessionGuardOptions = {}): void {
  const isStandalone = useIsStandalone()
  const statusUrl = options.statusUrl ?? ApiOauthRoutes.status
  const loginUrl = options.loginUrl ?? ApiOauthRoutes.login

  useEffect(() => {
    if (!isStandalone) return

    fetch(statusUrl)
      .then((res) => {
        if (res.status === HttpStatus.UNAUTHORIZED)
          window.location.replace(loginUrl)
      })
      .catch(() => {
        // Desktop unreachable — keep the app mounted; error surfaces elsewhere.
      })
  }, [isStandalone, statusUrl, loginUrl])
}
