export interface MiddlewareConfig {
  dev: boolean
  corsOrigin: string
  rateLimitMax?: number
  rateLimitWindow?: number
  jsonBodyLimit?: string
  helmetEnabled?: boolean
  csrfMode?: "double-submit"
  trustProxy?: boolean
  secureCookie?: boolean
}

export const defaultMiddlewareConfig: MiddlewareConfig = {
  dev: false,
  corsOrigin: "",
  rateLimitMax: 100,
  rateLimitWindow: 60_000,
  jsonBodyLimit: "10kb",
  helmetEnabled: true,
}
