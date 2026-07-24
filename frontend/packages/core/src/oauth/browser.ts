import { base64UrlEncode, sha256 } from "./utils"
import { OAUTH_PARAMS, OAUTH_VALUES, STORAGE_KEYS } from "./constants"

interface OAuthToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let _token: OAuthToken | null = null

function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

function generateState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function authorizeRedirect(
  authorizeUrl: string,
  clientId: string,
  redirectUri: string,
  scope?: string,
): Promise<void> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier))
  const state = generateState()

  sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier)
  sessionStorage.setItem(STORAGE_KEYS.state, state)

  const params = new URLSearchParams({
    [OAUTH_PARAMS.clientId]: clientId,
    [OAUTH_PARAMS.redirectUri]: redirectUri,
    [OAUTH_PARAMS.responseType]: OAUTH_VALUES.responseTypeCode,
    [OAUTH_PARAMS.codeChallenge]: codeChallenge,
    [OAUTH_PARAMS.codeChallengeMethod]: OAUTH_VALUES.s256,
    [OAUTH_PARAMS.state]: state,
  })

  if (scope) params.set(OAUTH_PARAMS.scope, scope)
  window.location.href = `${authorizeUrl}?${params}`
}

export async function handleRedirectCallback(
  tokenUrl: string,
  clientId: string,
  redirectUri: string,
): Promise<OAuthToken | null> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get(OAUTH_PARAMS.code)
  const state = params.get(OAUTH_PARAMS.state)
  const error = params.get(OAUTH_PARAMS.error)

  if (error) {
    console.error("OAuth authorize error:", error)
    return null
  }

  if (!code || !state) return null

  const savedState = sessionStorage.getItem(STORAGE_KEYS.state)
  if (state !== savedState) {
    console.error("OAuth state mismatch — possible CSRF")
    return null
  }

  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier)
  sessionStorage.removeItem(STORAGE_KEYS.codeVerifier)
  sessionStorage.removeItem(STORAGE_KEYS.state)

  if (!codeVerifier) return null

  const body = new URLSearchParams({
    [OAUTH_PARAMS.grantType]: OAUTH_VALUES.authorizationCode,
    [OAUTH_PARAMS.code]: code,
    [OAUTH_PARAMS.redirectUri]: redirectUri,
    [OAUTH_PARAMS.clientId]: clientId,
    [OAUTH_PARAMS.codeVerifier]: codeVerifier,
  })

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!res.ok) {
    console.error("OAuth token exchange failed", await res.text())
    return null
  }

  const json = await res.json()
  _token = {
    accessToken: json.accessToken ?? json.access_token,
    expiresAt: Date.now() + (json.expiresIn ?? json.expires_in) * 1000,
  }

  return _token
}

export function getAccessToken(): string | null {
  if (!_token || Date.now() >= _token.expiresAt) return null
  return _token.accessToken
}

export function clearTokens(): void {
  _token = null
}
