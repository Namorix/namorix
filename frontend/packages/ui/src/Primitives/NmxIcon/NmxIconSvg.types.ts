export const NmxIconSvgSymbol = {
  LOGO: "logo",
} as const

export type NmxIconSvgSymbol =
  (typeof NmxIconSvgSymbol)[keyof typeof NmxIconSvgSymbol]
