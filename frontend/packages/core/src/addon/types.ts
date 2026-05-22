import { NmxIconSvgSymbol } from "@namorix/ui"
import { nmxStore } from "../store"
import type { UserRole } from "../types"

export type NmxAddonIconType = NmxIconSvgSymbol

export interface NmxAddonManifest {
  id: string
  displayName: string
  description?: string
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
  role?: UserRole
}

export interface AddonContext {
  addonId: string
  nmxStore: typeof nmxStore
}

export interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void | Promise<void>
  unmount(): void
}

export interface AddonModule {
  manifest: NmxAddonManifest
  entry: AddonEntry
}
