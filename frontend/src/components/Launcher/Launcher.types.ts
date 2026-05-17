import React from "react"
import type { NmxAddonIconType } from "@namorix/core"

export interface LauncherAddonItem {
  id: string
  displayName: string
  icon?: NmxAddonIconType
}

export interface LauncherViewProps {
  items: LauncherAddonItem[]
  query: string
  onQueryChange: (query: string) => void
  onClearQuery: () => void
  onOpenApp: (id: string, label: string, icon?: React.ReactNode) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}
