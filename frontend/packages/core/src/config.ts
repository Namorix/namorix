let apiBaseUrl = "http://localhost:3000"
let hubsPath: string | undefined = "/hubs/main"
let isShellDesktop = false

export interface CoreConfig {
  apiBaseUrl?: string
  hubsPath?: string
  isShellDesktop?: boolean
}

export function configureCore(config: CoreConfig) {
  if (config.apiBaseUrl) {
    apiBaseUrl = config.apiBaseUrl
    hubsPath = config.hubsPath
    isShellDesktop = config.isShellDesktop === true
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function getHubsPath() {
  return hubsPath
}

export function isShellDesktopEnv() {
  return isShellDesktop
}
