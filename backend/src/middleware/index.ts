import { createMiddleware } from "@namorix/backend-core"
import { config } from "../config"

export const applyMiddleware = createMiddleware({
  dev: config.dev,
  corsOrigin: config.desktopOrigin,
  csrfMode: config.csrfMode,
  trustProxy: config.trustProxy,
  secureCookie: config.secureCookie,
})
