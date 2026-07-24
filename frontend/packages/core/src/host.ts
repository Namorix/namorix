import { createContext, useContext } from "react"

export type AddonMode = "standalone" | "widget"
const AddonModeContext = createContext<AddonMode>("standalone")
export const AddonModeProvider = AddonModeContext.Provider
export const useAddonMode = (): AddonMode => useContext(AddonModeContext)
export const useIsWidget = (): boolean => useAddonMode() === "widget"
export const useIsStandalone = (): boolean => useAddonMode() === "standalone"