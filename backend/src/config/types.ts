import path from "path"

export interface Config {
  dev: boolean
  port: number
  desktopOrigin: string
  jwtSecret: string
  jwtAccessTtl: string
  jwtRefreshTtl: string
  jwtRefreshRememberTtl: string
  dockerSocketPath: string
  addonNetwork: string
  addonHostBind: string
  dataDir: string
  csrfMode: "double-submit" | undefined
  trustProxy: boolean
  secureCookie: boolean
}

export const DATA_PATH =
  process.env.DATA_PATH ?? path.resolve(import.meta.dirname, "../../data")
