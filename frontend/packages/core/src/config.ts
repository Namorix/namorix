let apiBaseUrl = "http://localhost:3000"
let isShellDesktop = false

export interface CoreConfig {
  apiBaseUrl?: string
  isShellDesktop?: boolean
}

export function configureCore(config: CoreConfig) {
  if (config.apiBaseUrl) {
    apiBaseUrl = config.apiBaseUrl
    isShellDesktop = config.isShellDesktop === true
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function isShellDesktopEnv() {
  return isShellDesktop
}
