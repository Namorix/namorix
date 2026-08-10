import type { NmxCoreClient } from "../config"
import { getFingerprint } from "../fingerprint"
import { NMX_COOKIE_CSRF_KEY } from "../constants"
import { ApiAuthRoutes } from "../apiRoutes"

export type AuthRefreshResult = "success" | "expired" | "network"

export interface AuthRefreshService {
  refreshAccessToken(): Promise<AuthRefreshResult>
  setOnUnauthorized(handler: () => void): void
}

function readCsrfToken(): string | null {
  const regex = new RegExp(`(?:^|;\\s*)${NMX_COOKIE_CSRF_KEY}=([^;]*)`)
  const match = regex.exec(document.cookie)
  return match?.[1] ?? null
}

export function createAuthRefresh(core: NmxCoreClient): AuthRefreshService {
  let onUnauthorized: (() => void) | null = null
  let refreshPromise: Promise<AuthRefreshResult> | null = null

  async function doRefresh(): Promise<AuthRefreshResult> {
    const headers: Record<string, string> = {}
    const csrfToken = readCsrfToken()
    if (csrfToken) headers["x-csrf-token"] = csrfToken
    const fingerprint = getFingerprint()
    if (fingerprint) headers["x-device-fingerprint"] = fingerprint

    let res: Response
    try {
      res = await fetch(core.getApiBaseUrl() + ApiAuthRoutes.refresh, {
        method: "POST",
        credentials: "include",
        headers,
      })
    } catch {
      return "network"
    }

    if (res.status === 401) {
      onUnauthorized?.()
      return "expired"
    }

    return res.ok ? "success" : "network"
  }

  return {
    refreshAccessToken(): Promise<AuthRefreshResult> {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          refreshPromise = null
        })
      }
      return refreshPromise
    },
    setOnUnauthorized(handler: () => void) {
      onUnauthorized = handler
    },
  }
}
