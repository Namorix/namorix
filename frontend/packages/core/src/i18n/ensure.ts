import i18next from "i18next"
import { NmxI18n } from "./index"

export function ensureI18n(
  locales: Record<string, Record<string, unknown>>,
): void {
  if (i18next.isInitialized) {
    for (const [lang, data] of Object.entries(locales)) {
      i18next.addResourceBundle(lang, "translation", data, true, true)
    }
    return
  }

  const nmx = new NmxI18n()
  nmx.loadAll(locales)
  void nmx.start()
}
