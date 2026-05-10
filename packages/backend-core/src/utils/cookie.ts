import type { Response, Request, CookieOptions } from "express"
import {
  NMX_COOKIE_ACCESS_KEY,
  NMX_COOKIE_CSRF_KEY,
  NMX_COOKIE_REFRESH_KEY,
} from "@namorix/shared"

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
}

export function setAccessCookie(res: Response, token: string, secure: boolean) {
  res.cookie(NMX_COOKIE_ACCESS_KEY, token, {
    ...cookieOptions,
    secure,
  })
}

export function getAccessCookie(req: Request): string | undefined {
  return req.cookies[NMX_COOKIE_ACCESS_KEY] as string | undefined
}

export function clearAccessCookie(res: Response) {
  res.clearCookie(NMX_COOKIE_ACCESS_KEY)
}

export function setRefreshCookie(
  res: Response,
  token: string,
  secure: boolean,
) {
  res.cookie(NMX_COOKIE_REFRESH_KEY, token, {
    ...cookieOptions,
    secure,
  })
}

export function getRefreshCookie(req: Request): string | undefined {
  return req.cookies[NMX_COOKIE_REFRESH_KEY] as string | undefined
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(NMX_COOKIE_REFRESH_KEY)
}

export function setCsrfCookie(res: Response, token: string, secure: boolean) {
  res.cookie(NMX_COOKIE_CSRF_KEY, token, {
    ...cookieOptions,
    httpOnly: false,
    secure,
  })
}

export function getCsrfCookie(req: Request): string | undefined {
  return req.cookies[NMX_COOKIE_CSRF_KEY] as string | undefined
}

export function clearCsrfCookie(res: Response) {
  res.clearCookie(NMX_COOKIE_CSRF_KEY)
}
