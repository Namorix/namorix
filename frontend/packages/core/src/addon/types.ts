import { NmxIconSvgSymbol } from "@namorix/ui"

export type NmxAddonIconType = NmxIconSvgSymbol

export interface NmxAddonManifest {
  id: string
  displayName: string
  description?: string
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
}

export interface AddonContext {
  addonId: string
  locale: string
  theme: "light" | "dark"
}

export interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void | Promise<void>
  unmount(): void
}

export interface AddonModule {
  manifest: NmxAddonManifest
  entry: AddonEntry
}
