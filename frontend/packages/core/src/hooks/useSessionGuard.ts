import { useEffect, useState } from "react"
import { useIsStandalone } from "../mount"
import { HttpStatus } from "../types"
import { ApiOauthRoutes } from "../apiRoutes"

export type SessionGuardState = "loading" | "authenticated" | "unauthorized"

export interface SessionGuardOptions {
  statusUrl?: string
  loginUrl?: string
}

export function useSessionGuard(options: SessionGuardOptions = {}): SessionGuardState {
  const isStandalone = useIsStandalone()
  const [status, setStatus] = useState<SessionGuardState>("loading")
  const statusUrl = options.statusUrl ?? ApiOauthRoutes.status
  const loginUrl = options.loginUrl ?? ApiOauthRoutes.login

  useEffect(() => {
    if (!isStandalone) {
      setStatus("authenticated")
      return
    }

    let cancelled = false
    fetch(statusUrl)
      .then((res) => {
        if (cancelled) return
        if (res.status === HttpStatus.UNAUTHORIZED) {
          setStatus("unauthorized")
          window.location.replace(loginUrl)
        } else {
          setStatus("authenticated")
        }
      })
      .catch(() => {
        // Desktop unreachable — keep the app mounted; error surfaces elsewhere.
        if (!cancelled) setStatus("authenticated")
      })

    return () => {
      cancelled = true
    }
  }, [isStandalone, statusUrl, loginUrl])

  return status
}
