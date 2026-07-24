import type { WindowId } from "../store"
import type { NmxAddonManifest } from "../addons"

export interface AddonItem extends NmxAddonManifest {
  id: WindowId
  disabled?: boolean
}

export type OnOpenApp = (item: AddonItem, rect?: DOMRect) => void
