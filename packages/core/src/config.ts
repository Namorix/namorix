let apiBaseUrl = "http://localhost:3000"

export interface CoreConfig {
  apiBaseUrl?: string
}

export function configureCore(config: CoreConfig) {
  if (config.apiBaseUrl) {
    apiBaseUrl = config.apiBaseUrl
  }
}

export function getApiBaseUrl() {
  return apiBaseUrl
}
