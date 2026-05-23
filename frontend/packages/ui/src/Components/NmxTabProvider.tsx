import React, { useCallback, useMemo } from "react"
import { NmxTabContext, type NmxTabContextValue } from "./NmxTabContext"
import { useTabCache } from "@namorix/core"

export const NmxTabProvider: React.FC<{
  defaultTab?: string
  onTabChange?: (tab: string) => void
  children: React.ReactNode
}> = ({ defaultTab = "", onTabChange, children }) => {
  const { activeTab, setActiveTab, isMounted } = useTabCache(defaultTab)

  const handleSetTab = useCallback(
    (tab: string) => {
      setActiveTab(tab)
      onTabChange?.(tab)
    },
    [setActiveTab, onTabChange],
  )

  const value = useMemo<NmxTabContextValue>(
    () => ({
      activeTab,
      setActiveTab: handleSetTab,
      isMounted: isMounted as (key: string) => boolean,
    }),
    [activeTab, handleSetTab, isMounted],
  )

  return (
    <NmxTabContext.Provider value={value}>{children}</NmxTabContext.Provider>
  )
}
