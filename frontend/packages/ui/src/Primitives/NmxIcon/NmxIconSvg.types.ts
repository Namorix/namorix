export const NmxIconSvgSymbol = {
  LOGO: "logo",
  APP_ABOUT: "app-about",
  APP_LOGS: "app-logs",
  APP_SETTINGS: "app-settings",
  APP_SYSTEM_MONITOR: "app-system-monitor",
  APP_NETWORK_TRAFFIC: "app-network-traffic",
  APP_FILE_MANAGER: "app-file-manager",
  APP_TERMINAL: "app-terminal",
} as const

export type NmxIconSvgSymbol =
  (typeof NmxIconSvgSymbol)[keyof typeof NmxIconSvgSymbol]
