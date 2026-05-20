export const NmxIconFontSymbol = {
  SECURITY: "ic-security",
  SEARCH: "ic-search",
  CLOSE: "ic-close",
  MINIMIZE: "ic-minimize",
  MAXIMIZE: "ic-maximize",
  RESTORE: "ic-restore",
  ARROW_PREV: "ic-arrow-prev",
  ARROW_NEXT: "ic-arrow-next",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
