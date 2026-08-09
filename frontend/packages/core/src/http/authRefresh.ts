import { getApiBaseUrl } from "../config"
import { getFingerprint } from "../fingerprint"
import { NMX_COOKIE_CSRF_KEY } from "../constants"
import { ApiAuthRoutes } from "../apiRoutes"

export type AuthRefreshResult = "success" | "expired" | "network"

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null
let refreshPromise: Promise<AuthRefreshResult> | null = null

function readCsrfToken(): string | null {
  const regex = new RegExp(`(?:^|;\\s*)${NMX_COOKIE_CSRF_KEY}=([^;]*)`)
  const match = regex.exec(document.cookie)
  return match?.[1] ?? null
}

async function doRefresh(): Promise<AuthRefreshResult> {
  const headers: Record<string, string> = {}
  const csrfToken = readCsrfToken()
  if (csrfToken) headers["x-csrf-token"] = csrfToken
  const fingerprint = getFingerprint()
  if (fingerprint) headers["x-device-fingerprint"] = fingerprint

  let res: Response
  try {
    res = await fetch(getApiBaseUrl() + ApiAuthRoutes.refresh, {
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

export function refreshAccessToken(): Promise<AuthRefreshResult> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export function setOnUnauthorized(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}
