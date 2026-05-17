export const NmxIconSvgSymbol = {
  LOGO: "logo",
  APP_LOGS: "app-logs",
} as const

export type NmxIconSvgSymbol =
  (typeof NmxIconSvgSymbol)[keyof typeof NmxIconSvgSymbol]
