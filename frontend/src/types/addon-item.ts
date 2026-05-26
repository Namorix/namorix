import type { LocaleKeys, NmxAddonIconType } from "@namorix/core"
import type { WindowId } from "../store"

export interface AddonItem {
  id: WindowId
  displayName: string
  description?: string
  localeKey?: LocaleKeys
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
}

export type OnOpenApp = (
  id: WindowId,
  displayName: string,
  localeKey?: LocaleKeys,
  icon?: NmxAddonIconType,
  rect?: DOMRect,
  defaultWidth?: number,
  defaultHeight?: number,
  preferFullSize?: boolean,
) => void
