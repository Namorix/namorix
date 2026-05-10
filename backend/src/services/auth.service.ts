import bcrypt from "bcrypt"
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "@namorix/backend-core"
import { getDB, refreshTokens, users } from "../db"
import { AuthResult, AuthStatus, User } from "@namorix/shared"
import { lt, eq } from "drizzle-orm"
import { isSignUpEnabled } from "./settings.service"
import { config } from "../config"

export async function signIn(
  username: string,
  password: string,
  meta: {
    userAgent?: string
    fingerprint?: string
    ipAddress?: string
    rememberMe?: boolean
  },
): Promise<AuthResult | null> {
  const db = getDB()
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  })
  if (!user) {
    return null
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return null
  }

  const refreshTtl = meta.rememberMe
    ? config.jwtRefreshRememberTtl
    : config.jwtRefreshTtl
  const refreshToken = signRefreshToken(user.id, refreshTtl)
  const payload = verifyToken(refreshToken)
  const now = new Date().toISOString()

  if (!payload) {
    return null
  }

  await db.insert(refreshTokens).values({
    jti: payload.jti,
    userId: user.id,
    userAgent: meta.userAgent,
    fingerprint: meta.fingerprint,
    ipAddress: meta.ipAddress,
    lastUsedAt: now,
    createAt: now,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  })
  return {
    user: { id: user.id, username: user.username, role: user.role },
    accessToken: signAccessToken(
      user.id,
      user.username,
      user.role,
      config.jwtAccessTtl,
    ),
    refreshToken,
  }
}

export async function signUp(
  username: string,
  password: string,
): Promise<User | null> {
  const db = getDB()
  const hashedPassword = await bcrypt.hash(password, 10)

  return db.transaction((tx) => {
    const existing = tx.query.users
      .findFirst({
        where: (u, { eq }) => eq(u.username, username),
      })
      .sync()
    if (existing) {
      return null
    }

    const firstUser = tx.select().from(users).limit(1).all()
    const role = firstUser.length === 0 ? 1 : 0

    const [newUser] = tx
      .insert(users)
      .values({
        username,
        role,
        password: hashedPassword,
        createAt: new Date().toISOString(),
      })
      .returning()
      .all()

    return {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    }
  })
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const db = getDB()
  const result = await db.select().from(users).limit(1)

  return {
    needsSignup: result.length === 0,
    signUpEnabled: await isSignUpEnabled(),
  }
}

export async function refreshToken(
  token: string,
  currentFingerprint?: string,
  currentIp?: string,
): Promise<AuthResult | null> {
  try {
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const db = getDB()
    const existing = await db.query.refreshTokens.findFirst({
      where: (t, { eq }) => eq(t.jti, payload.jti),
    })
    if (!existing) {
      await revokeAllUserTokens(payload.userId)
      return null
    }

    if (currentFingerprint && currentFingerprint !== existing.fingerprint) {
      if (currentIp && currentIp !== existing.ipAddress) {
        await revokeAllUserTokens(payload.userId)
        return null
      }
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.userId),
    })
    if (!user) {
      await revokeToken(payload.jti)
      return null
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.jti, payload.jti))

    const remainingMs = new Date(existing.expiresAt).getTime() - Date.now()
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000))
    const newRefresh = signRefreshToken(
      payload.userId,
      `${remainingSeconds.toString()}s`,
    )
    const newPayload = verifyToken(newRefresh)
    const now = new Date().toISOString()

    if (!newPayload) {
      return null
    }

    await db.insert(refreshTokens).values({
      jti: newPayload.jti,
      userId: payload.userId,
      userAgent: existing.userAgent,
      fingerprint: existing.fingerprint,
      ipAddress: existing.ipAddress,
      lastUsedAt: now,
      createAt: existing.createAt,
      expiresAt: new Date(newPayload.exp * 1000).toISOString(),
    })

    return {
      user: {
        id: payload.userId,
        username: user.username,
        role: user.role,
      },
      accessToken: signAccessToken(
        payload.userId,
        user.username,
        user.role,
        config.jwtAccessTtl,
      ),
      refreshToken: newRefresh,
    }
  } catch {
    return null
  }
}

export async function revokeToken(jti: string): Promise<void> {
  const db = getDB()
  await db.delete(refreshTokens).where(eq(refreshTokens.jti, jti))
}

export async function revokeAllUserTokens(userId: number): Promise<void> {
  const db = getDB()
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
}

export async function cleanupExpiredTokens(): Promise<void> {
  const db = getDB()
  await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, new Date().toISOString()))
}
