export const NmxIconSvgSymbol = {
  LOGO: "logo",
  APP_UNKNOWN: "app-unknown",
  APP_SYSTEM: "app-system",
  APP_ABOUT: "app-about",
  APP_LOGS: "app-logs",
  APP_SETTINGS: "app-settings",
  APP_SYSTEM_MONITOR: "app-system-monitor",
  APP_NETWORK_TRAFFIC: "app-network-traffic",
  APP_FILE_MANAGER: "app-file-manager",
  APP_TERMINAL: "app-terminal",
  APP_NOTIFICATION_CENTER: "app-notification-center",
  APP_PACKAGE_CENTER: "app-package-center",
} as const

export type NmxIconSvgSymbol =
  (typeof NmxIconSvgSymbol)[keyof typeof NmxIconSvgSymbol]
