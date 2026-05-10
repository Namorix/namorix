import { NmxI18n } from "@namorix/core"
import en from "./locales/en.json"
import vi from "./locales/vi.json"

export const i18n = new NmxI18n()
  .load("en", "translation", en)
  .load("vi", "translation", vi)
  .start()
