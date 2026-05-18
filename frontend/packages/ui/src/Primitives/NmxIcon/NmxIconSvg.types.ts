export const NmxIconSvgSymbol = {
  LOGO: "logo",
  APP_LOGS: "app-logs",
  APP_SETTINGS: "app-settings",
} as const

export type NmxIconSvgSymbol =
  (typeof NmxIconSvgSymbol)[keyof typeof NmxIconSvgSymbol]
