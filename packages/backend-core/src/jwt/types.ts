export interface JwtPayload {
  userId: number
  username: string
  role: number
  jti: string
  iat: number
  exp: number
}

export const ACCESS_TOKEN_TTL = "15m"
export const REFRESH_TOKEN_TTL = "7d"
