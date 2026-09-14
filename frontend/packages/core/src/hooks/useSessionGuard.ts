import { useEffect, useState } from "react"
import { useIsStandalone } from "../mount"
import { HttpStatus } from "../types"
import { ApiOauthRoutes } from "../apiRoutes"

export type SessionGuardState = "loading" | "authenticated" | "unauthorized"

export interface SessionGuardOptions {
  statusUrl?: string
  loginUrl?: string
}

export interface SessionGuardResult {
  state: SessionGuardState
  userId: number | null
}

export function useSessionGuard(
  options: SessionGuardOptions = {},
): SessionGuardResult {
  const isStandalone = useIsStandalone()
  const [result, setResult] = useState<SessionGuardResult>({
    state: "loading",
    userId: null,
  })
  const statusUrl = options.statusUrl ?? ApiOauthRoutes.status
  const loginUrl = options.loginUrl ?? ApiOauthRoutes.login

  useEffect(() => {
    if (!isStandalone) {
      // Inside the desktop shell the session belongs to the shell, so the addon is told
      // nothing about who is logged in rather than being handed a guess.
      const timeout = setTimeout(
        () => setResult({ state: "authenticated", userId: null }),
        0,
      )
      return () => clearTimeout(timeout)
    }

    let cancelled = false
    fetch(statusUrl)
      .then(async (res) => {
        if (cancelled) return
        if (res.status === HttpStatus.UNAUTHORIZED) {
          setResult({ state: "unauthorized", userId: null })
          window.location.replace(loginUrl)
          return
        }

        // Identity lives only in the body. An unreadable one must not end the session,
        // so it degrades to "authenticated with no user" — the same outcome as a
        // desktop that cannot be reached.
        const body = (await res.json().catch(() => null)) as {
          userId?: unknown
        } | null
        const userId = body?.userId
        if (cancelled) return
        setResult({
          state: "authenticated",
          userId: typeof userId === "number" ? userId : null,
        })
      })
      .catch(() => {
        // Desktop unreachable — keep the app mounted; error surfaces elsewhere.
        if (!cancelled) setResult({ state: "authenticated", userId: null })
      })

    return () => {
      cancelled = true
    }
  }, [isStandalone, statusUrl, loginUrl])

  return result
}
