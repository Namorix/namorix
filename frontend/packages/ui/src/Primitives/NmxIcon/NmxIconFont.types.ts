export const NmxIconFontSymbol = {
  SECURITY: "ic-security",
  SEARCH: "ic-search",
  CLOSE: "ic-close",
  MINIMIZE: "ic-minimize",
  MAXIMIZE: "ic-maximize",
  RESTORE: "ic-restore",
  ARROW_PREV: "ic-arrow-prev",
  ARROW_NEXT: "ic-arrow-next",
  MENU: "ic-menu",
  MENU_FOLD: "ic-menu-fold",
  LOGS: "ic-logs",
  NODES: "ic-nodes",
  STATS: "ic-stats",
  APPEARANCE: "ic-appearance",
  SETTING: "ic-setting",
  USER: "ic-user",
} as const

export type NmxIconFontSymbol =
  (typeof NmxIconFontSymbol)[keyof typeof NmxIconFontSymbol]
