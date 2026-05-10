import jwt from "jsonwebtoken"
import type { StringValue } from "ms"
import type { JwtPayload } from "./types"
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "./types"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-izerocs"

export function signAccessToken(
  userId: number,
  username: string,
  role: number,
  ttl?: string,
): string {
  return jwt.sign(
    { userId, username, role, jti: crypto.randomUUID() },
    JWT_SECRET,
    {
      expiresIn: ttl ? (ttl as StringValue) : ACCESS_TOKEN_TTL,
    },
  )
}

export function signRefreshToken(userId: number, ttl?: string): string {
  return jwt.sign({ userId, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: ttl ? (ttl as StringValue) : REFRESH_TOKEN_TTL,
  })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export * from "./types"
