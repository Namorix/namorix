import { nmxStore, NmxStoreKeys, useNmxStore } from "."
import { NMX_THEME_CSS_PATH_KEY, NMX_THEME_STORAGE_KEY } from "../constants"
import type { AppearanceSettings, User } from "../types"

export const setUserStore = (user: User | null) =>
  nmxStore.set(NmxStoreKeys.user, user)
export const useUserStore = () => useNmxStore(NmxStoreKeys.user)

export const setThemeStore = (id: string | null, cssPath?: string) => {
  nmxStore.set(NmxStoreKeys.theme, id)
  if (id !== null) localStorage.setItem(NMX_THEME_STORAGE_KEY, id)
  if (cssPath !== undefined)
    localStorage.setItem(NMX_THEME_CSS_PATH_KEY, cssPath)
}

export const useThemeStore = () => useNmxStore(NmxStoreKeys.theme)

export const setRegisterEnabledStore = (v: boolean) =>
  nmxStore.set(NmxStoreKeys.registerEnabled, v)
export const useRegisterEnabledStore = () =>
  useNmxStore(NmxStoreKeys.registerEnabled)

export const setNeedsRegisterStore = (v: boolean) =>
  nmxStore.set(NmxStoreKeys.needsRegister, v)
export const useNeedsRegisterStore = () =>
  useNmxStore(NmxStoreKeys.needsRegister)

export const setAppearanceStore = (v: AppearanceSettings) =>
  nmxStore.set(NmxStoreKeys.appearance, v)
export const useAppearanceStore = () =>
  useNmxStore(NmxStoreKeys.appearance) as AppearanceSettings | null
