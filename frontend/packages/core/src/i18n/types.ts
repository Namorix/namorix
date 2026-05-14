export const NmxI18nLang = {
  EN: "en",
  VI: "vi",
} as const

export type NmxI18nLang = (typeof NmxI18nLang)[keyof typeof NmxI18nLang]
