export const NmxIconFontSymbol = {
  SECURITY: "ic-security",
  SEARCH: "ic-search",
  CLOSE: "ic-close",
  MINIMIZE: "ic-minimize",
  MAXIMIZE: "ic-maximize",
  RESTORE: "ic-restore",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
