import React, { useMemo } from "react"
import { NmxTabContext, type NmxTabContextValue } from "./NmxTabContext"
import { useTabCache } from "@namorix/core"

export const NmxTabProvider: React.FC<{
  defaultTab?: string
  children: React.ReactNode
}> = ({ defaultTab = "", children }) => {
  const { activeTab, setActiveTab, isMounted } = useTabCache(defaultTab)

  const value = useMemo<NmxTabContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      isMounted: isMounted as (key: string) => boolean,
    }),
    [activeTab, setActiveTab, isMounted],
  )

  return (
    <NmxTabContext.Provider value={value}>{children}</NmxTabContext.Provider>
  )
}
