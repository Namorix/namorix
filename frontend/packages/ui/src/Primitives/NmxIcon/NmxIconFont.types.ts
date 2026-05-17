export const NmxIconFontSymbol = {
  SECURITY: "ic-security",
  SEARCH: "ic-search",
  CLOSE: "ic-close",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
