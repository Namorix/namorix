import { createContext, useContext } from "react"

export interface NmxTabContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
  isMounted: (key: string) => boolean
}

export const NmxTabContext = createContext<NmxTabContextValue | null>(null)

export function useNmxTabContext() {
  const ctx = useContext(NmxTabContext)
  if (!ctx) {
    throw new Error(
      "useNmxTabContext must be used within NmxTabProvider. " +
        "Wrap your tree in a component that provides tab context (NmxToolbar with defaultTab, NmxRail with defaultTab, or NmxTabProvider).",
    )
  }
  return ctx
}

export function useActiveTab<T extends string = string>() {
  return useNmxTabContext().activeTab as T
}
