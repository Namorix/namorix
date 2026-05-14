import { ApiMiddlewareRoutes, getApiBaseUrl, http } from "@namorix/core"

async function checkUntrustedProxy() {
  return await http
    .url(getApiBaseUrl() + ApiMiddlewareRoutes.health)
    .get()
    .json()
}

export const healthController = { checkUntrustedProxy }
