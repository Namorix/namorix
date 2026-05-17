import type { NmxAddonIconType } from "@namorix/core"

export interface TaskbarApp {
  id: string
  icon?: NmxAddonIconType
  title: string
  isActive: boolean
  isMaximized: boolean
}
