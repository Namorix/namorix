export const OAUTH_WELL_KNOWN_PATH = "/.well-known/nmx-oauth-config"

export const STORAGE_KEYS = {
  codeVerifier: "oauth:code_verifier",
  state: "oauth:state",
} as const

export const OAUTH_PARAMS = {
  clientId: "client_id",
  redirectUri: "redirect_uri",
  responseType: "response_type",
  codeChallenge: "code_challenge",
  codeChallengeMethod: "code_challenge_method",
  state: "state",
  scope: "scope",
  grantType: "grant_type",
  code: "code",
  error: "error",
  codeVerifier: "code_verifier",
} as const

export const OAUTH_VALUES = {
  responseTypeCode: "code",
  s256: "S256",
  authorizationCode: "authorization_code",
} as const
