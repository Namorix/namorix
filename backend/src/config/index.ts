import { getJwtSecret } from "./secret"
import { DATA_PATH, type Config } from "./types"

const secret = getJwtSecret()
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production")
}

export const config: Config = {
  dev: process.env.NODE_ENV !== "prod",
  port: Number(process.env.PORT) || 3000,
  desktopOrigin: process.env.DESKTOP_ORIGIN ?? "http://192.168.31.150:5173",
  jwtSecret: secret,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? "5m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  jwtRefreshRememberTtl: process.env.JWT_REFRESH_REMEMBER_TTL ?? "90d",
  dockerSocketPath: process.env.DOCKER_SOCKET_PATH ?? "/var/run/docker.sock",
  addonNetwork: process.env.ADDON_NETWORK ?? "namorix_net",
  addonHostBind: process.env.ADDON_HOST_BIND ?? "127.0.0.1",
  dataDir: DATA_PATH,
  csrfMode: process.env.CSRF_DISABLE === "true" ? undefined : "double-submit",
  trustProxy: process.env.TRUST_PROXY === "true" || true,
  secureCookie: process.env.SECURE_COOKIE === "true",
}

export * from "./types"
