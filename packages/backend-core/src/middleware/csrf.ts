import type { Request, Response, NextFunction } from "express"
import crypto from "crypto"
import { apiSystemError, HttpStatus, SystemErrorCode } from "@namorix/shared"
import { getCsrfCookie, sendError, setCsrfCookie } from "../utils"

export function setCsrf(secureCookie: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!getCsrfCookie(req)) {
      setCsrfCookie(res, crypto.randomUUID(), secureCookie)
    }
    next()
  }
}

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next()
    return
  }
  const cookieToken = getCsrfCookie(req)
  const headerToken = req.headers["x-csrf-token"]
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    sendError(
      res,
      apiSystemError("CSRF validation failed", SystemErrorCode.CSRF_MISMATCH),
      HttpStatus.FORBIDDEN,
    )
    return
  }
  next()
}
