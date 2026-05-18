import React from "react"
import type { NmxAddonIconType } from "@namorix/core"
import type { NmxIconSvgSymbol } from "@namorix/ui"

export interface LauncherAddonItem {
  id: string
  displayName: string
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
}

export interface LauncherViewProps {
  items: LauncherAddonItem[]
  query: string
  onQueryChange: (query: string) => void
  onClearQuery: () => void
  onOpenApp: (
    id: string,
    label: string,
    icon?: NmxIconSvgSymbol,
    rect?: DOMRect,
    defaultWidth?: number,
    defaultHeight?: number,
    preferFullSize?: boolean,
  ) => void
  searchRef: React.RefObject<HTMLInputElement | null>
}
