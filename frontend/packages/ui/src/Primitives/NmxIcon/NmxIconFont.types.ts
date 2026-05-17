export const NmxIconFontSymbol = {
  LOGO_LIGHT: "ic-logo-symbol-light",
  LOGO_DARK: "ic-logo-symbol-dark",
  SECURITY: "ic-security",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
