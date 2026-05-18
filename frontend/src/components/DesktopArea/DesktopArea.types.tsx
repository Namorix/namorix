import type { NmxAddonIconType } from "@namorix/core"

export interface DesktopIconData {
  id: string
  icon?: NmxAddonIconType
  label: string
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
}
