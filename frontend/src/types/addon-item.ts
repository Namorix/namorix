import type { NmxAddonIconType } from "@namorix/core"
import type { WindowId } from "../store"

export interface AddonItem {
  id: WindowId
  displayName: string
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
}

export type OnOpenApp = (
  id: WindowId,
  displayName: string,
  icon?: NmxAddonIconType,
  rect?: DOMRect,
  defaultWidth?: number,
  defaultHeight?: number,
  preferFullSize?: boolean,
) => void
