import { ApiMiddlewareRoutes } from "@namorix/core"
import { coreConfig } from "../config/coreConfig"

async function checkUntrustedProxy() {
  return await coreConfig.http
    .url(coreConfig.getApiBaseUrl() + ApiMiddlewareRoutes.health)
    .get()
    .json()
}

export const healthController = { checkUntrustedProxy }
