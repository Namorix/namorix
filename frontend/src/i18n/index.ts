import { NmxI18n } from "@namorix/core"

import en from "./locales/en.json"
import vi from "./locales/vi.json"

import notificationEn from "./locales/notification/en.json"
import notificationVi from "./locales/notification/vi.json"

export const i18n = new NmxI18n()
  .load("en", "translation", en)
  .load("vi", "translation", vi)
  .load("en", "notification", notificationEn)
  .load("vi", "notification", notificationVi)
  .start()
