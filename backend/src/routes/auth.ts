import type { Request, Response } from "express"
import {
  getAuthStatus,
  refreshToken,
  revokeAllUserTokens,
  revokeToken,
  signIn,
  signUp,
} from "../services/auth.service"
import {
  apiAuthError,
  AuthConstraints,
  AuthErrorCode,
  HttpStatus,
} from "@namorix/shared"
import {
  clearAccessCookie,
  clearRefreshCookie,
  getAccessCookie,
  getClientIp,
  getRefreshCookie,
  setAccessCookie,
  setRefreshCookie,
  verifyToken,
} from "@namorix/backend-core"
import { isSignUpEnabled } from "../services/settings.service"
import {
  Controller,
  Get,
  Post,
  sendError,
  sendSuccess,
  Validate,
} from "@namorix/backend-core"
import { config } from "../config"

@Controller("/api/auth")
export class AuthController {
  @Validate({
    username: {
      required: true,
      type: "string",
      minLength: AuthConstraints.username.minLength,
      maxLength: AuthConstraints.username.maxLength,
      trim: true,
    },
    password: {
      required: true,
      type: "string",
      minLength: AuthConstraints.password.minLength,
    },
  })
  @Post("/signin")
  async signIn(req: Request, res: Response) {
    const { username, password, rememberMe } = req.body as {
      username: string
      password: string
      rememberMe?: unknown
    }

    const result = await signIn(username, password, {
      userAgent: req.headers["user-agent"] ?? "",
      fingerprint: String(req.headers["x-device-fingerprint"] ?? ""),
      ipAddress: getClientIp(req),
      rememberMe: rememberMe === true,
    })
    if (!result) {
      sendError(
        res,
        apiAuthError("Invalid username or password", "INVALID_CREDENTIALS"),
        HttpStatus.UNAUTHORIZED,
      )
      return
    }

    setAccessCookie(res, result.accessToken, config.secureCookie)
    setRefreshCookie(res, result.refreshToken, config.secureCookie)
    sendSuccess(res, { user: result.user })
  }

  @Validate({
    username: {
      required: true,
      type: "string",
      minLength: AuthConstraints.username.minLength,
      maxLength: AuthConstraints.username.maxLength,
      trim: true,
    },
    password: {
      required: true,
      type: "string",
      minLength: AuthConstraints.password.minLength,
    },
  })
  @Post("/signup")
  async signUp(req: Request, res: Response) {
    const signupEnabled = await isSignUpEnabled()
    if (!signupEnabled) {
      sendError(
        res,
        apiAuthError("Signup closed", AuthErrorCode.SIGNUP_CLOSED),
        HttpStatus.FORBIDDEN,
      )
      return
    }

    const { username, password } = req.body as {
      username: string
      password: string
    }
    const result = await signUp(username, password)
    if (!result) {
      sendError(
        res,
        apiAuthError("Username already exists", "USERNAME_EXISTS"),
        HttpStatus.CONFLICT,
      )
      return
    }

    sendSuccess(res, { user: result })
  }

  @Post("/signout")
  async signOut(req: Request, res: Response) {
    const refresh = getRefreshCookie(req)
    if (refresh) {
      const payload = verifyToken(refresh)
      if (payload?.jti) {
        await revokeToken(payload.jti)
      }
    }
    clearAccessCookie(res)
    clearRefreshCookie(res)
    sendSuccess(res, null)
  }

  @Post("/signout-all")
  async signOutAll(req: Request, res: Response) {
    const token = getAccessCookie(req)
    if (token) {
      const payload = verifyToken(token)
      if (payload?.userId) {
        await revokeAllUserTokens(payload.userId)
      }
    }
    clearAccessCookie(res)
    clearRefreshCookie(res)
    sendSuccess(res, null)
  }

  @Get("/session")
  session(req: Request, res: Response) {
    const token = getAccessCookie(req)
    if (!token) {
      sendError(
        res,
        apiAuthError("Unauthorized", "UNAUTHORIZED"),
        HttpStatus.UNAUTHORIZED,
      )
      return
    }

    const payload = verifyToken(token)
    if (!payload) {
      sendError(
        res,
        apiAuthError("Unauthorized", "UNAUTHORIZED"),
        HttpStatus.UNAUTHORIZED,
      )
      return
    }

    sendSuccess(res, {
      user: {
        id: payload.userId,
        username: payload.username,
      },
    })
  }

  @Post("/refresh")
  async refresh(req: Request, res: Response) {
    const token = getRefreshCookie(req)
    if (!token) {
      sendError(
        res,
        apiAuthError("Unauthorized", "UNAUTHORIZED"),
        HttpStatus.UNAUTHORIZED,
      )
      return
    }

    const currentFingerprint = String(req.headers["x-device-fingerprint"] ?? "")
    const currentIp = getClientIp(req)

    const result = await refreshToken(token, currentFingerprint, currentIp)
    if (!result) {
      sendError(
        res,
        apiAuthError("Unauthorized", "UNAUTHORIZED"),
        HttpStatus.UNAUTHORIZED,
      )
      return
    }

    setAccessCookie(res, result.accessToken, config.secureCookie)
    setRefreshCookie(res, result.refreshToken, config.secureCookie)
    sendSuccess(res, { user: result.user })
  }

  @Get("/status")
  async status(_req: Request, res: Response) {
    sendSuccess(res, await getAuthStatus())
  }
}
