export interface CoreConfig {
  apiBaseUrl?: string
  hubsPath?: string
  isShellDesktop?: boolean
}

export interface NmxCoreClient {
  getApiBaseUrl(): string
  getHubsPath(): string
  isShellDesktopEnv(): boolean
}

const DEFAULT_API_BASE_URL = "http://localhost:3000"
const DEFAULT_HUBS_PATH = "/hubs/main"

export function createNmxCore(config: CoreConfig = {}): NmxCoreClient {
  const state = {
    apiBaseUrl: config.apiBaseUrl ?? DEFAULT_API_BASE_URL,
    hubsPath: config.hubsPath ?? DEFAULT_HUBS_PATH,
    isShellDesktop: config.isShellDesktop === true,
  }
  return {
    getApiBaseUrl: () => state.apiBaseUrl,
    getHubsPath: () => state.hubsPath,
    isShellDesktopEnv: () => state.isShellDesktop,
  }
}
