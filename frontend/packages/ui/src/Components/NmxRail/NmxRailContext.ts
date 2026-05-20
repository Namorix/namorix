import React from "react"

export interface NmxRailContextValue {
  collapsed: boolean
  collapseOnActiveClick: boolean
  toggleCollapsed: () => void
}

export const NmxRailContext = React.createContext<NmxRailContextValue>({
  collapsed: false,
  collapseOnActiveClick: false,
  toggleCollapsed: () => {},
})
