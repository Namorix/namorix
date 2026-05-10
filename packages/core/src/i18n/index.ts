import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enCore from "./locales/en.json"
import viCore from "./locales/vi.json"
import { NmxI18nLang } from "./types"

const _coreLocales = {
  [NmxI18nLang.EN]: enCore,
  [NmxI18nLang.VI]: viCore,
} satisfies Record<NmxI18nLang, Record<string, unknown>>

export class NmxI18n {
  private _resources: Record<string, Record<string, Record<string, unknown>>>
  private _started = false

  constructor() {
    this._resources = Object.fromEntries(
      Object.values(NmxI18nLang).map((lang) => [
        lang,
        { core: _coreLocales[lang] },
      ]),
    )
  }

  load(locale: NmxI18nLang, ns: string, data: Record<string, unknown>): this {
    if (this._started) {
      throw new Error("Already NmxI18n is started")
    }

    if (!(Object.values(NmxI18nLang) as string[]).includes(locale)) {
      throw new Error("Not support language")
    }

    this._resources[locale] ??= {}
    this._resources[locale][ns] = data
    return this
  }

  async start(options?: {
    lng?: string
    fallbackLng?: string
    defaultNS?: string
  }): Promise<typeof i18n> {
    const nsList = Object.keys(this._resources.en ?? {})
    await i18n.use(initReactI18next).init({
      resources: this._resources,
      ns: nsList,
      defaultNS: options?.defaultNS ?? "translation",
      fallbackNS: nsList,
      lng: options?.lng ?? localStorage.getItem("lang") ?? "en",
      fallbackLng: options?.fallbackLng ?? "en",
      interpolation: { escapeValue: false },
    })

    return i18n
  }
}

export * from "./types"
export * from "./validation-messages"
export * from "./validation-runner"
