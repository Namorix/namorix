export const NmxIconFontSymbol = {
  SECURITY: "ic-security",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
