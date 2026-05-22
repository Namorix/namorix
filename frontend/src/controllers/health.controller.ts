import { ApiMiddlewareRoutes, getApiBaseUrl, nmxHttp } from "@namorix/core"

async function checkUntrustedProxy() {
  return await nmxHttp
    .url(getApiBaseUrl() + ApiMiddlewareRoutes.health)
    .get()
    .json()
}

export const healthController = { checkUntrustedProxy }
