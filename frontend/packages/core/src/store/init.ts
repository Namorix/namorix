import { setThemeStore } from "."
import { NMX_THEME_STORAGE_KEY } from "../constants"

let initialized = false
export function initStores() {
  if (initialized) {
    return
  }

  initialized = true
  setThemeStore(localStorage.getItem(NMX_THEME_STORAGE_KEY))
}
