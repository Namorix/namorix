import type { Request } from "express"

function cleanIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip
}

function getFirst(val: string | string[] | undefined): string | undefined {
  if (typeof val === "string") {
    return val.split(",")[0]?.trim()
  }
  if (Array.isArray(val)) {
    return val[0]?.trim()
  }
  return undefined
}

function passIp(val: string | string[] | undefined): string | undefined {
  if (typeof val === "string" && val.length > 0) {
    return val
  }
  return undefined
}

export function getClientIp(req: Request): string {
  const headers = req.headers

  return cleanIp(
    passIp(headers["cf-connecting-ip"]) ??
      getFirst(passIp(headers["x-forwarded-for"])) ??
      passIp(headers["x-real-ip"]) ??
      passIp(headers["x-client-ip"]) ??
      passIp(headers["true-client-ip"]) ??
      "unknown",
  )
}
