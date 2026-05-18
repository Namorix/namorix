import type { NmxAddonIconType } from "@namorix/core"
import type { WindowId } from "../../types"

export interface TaskbarApp {
  id: WindowId
  icon?: NmxAddonIconType
  title: string
  isActive: boolean
  isMaximized: boolean
}
