import type { NmxAddonManifest } from "@namorix/core"
import type { WindowId } from "../store"

export interface AddonItem extends NmxAddonManifest {
  id: WindowId
}

export type OnOpenApp = (item: AddonItem, rect?: DOMRect) => void
