import { NmxIconSvgSymbol } from "@namorix/ui"
import { nmxStore } from "../store"
import type { UserRole } from "../types"

export type NmxAddonIconType = NmxIconSvgSymbol

export const NmxAddonLocaleKeys = {
  about: "about",
  logViewer: "logViewer",
  settings: "settings",
  systemMonitor: "systemMonitor",
  networkTraffic: "networkTraffic",
  fileManager: "fileManager",
  terminal: "terminal",
  notificationCenter: "notificationCenter",
  packageCenter: "packageCenter",
} as const

export type NmxAddonLocaleKeys =
  (typeof NmxAddonLocaleKeys)[keyof typeof NmxAddonLocaleKeys]

export const NmxAddonInstanceMode = {
  single: "single",
  multi: "multi",
}

export type NmxAddonInstanceMode =
  (typeof NmxAddonInstanceMode)[keyof typeof NmxAddonInstanceMode]

export interface NmxAddonManifest {
  id: string
  displayName: string
  description?: string
  localeKey?: NmxAddonLocaleKeys
  icon?: NmxAddonIconType
  defaultWidth?: number
  defaultHeight?: number
  preferFullSize?: boolean
  role?: UserRole
  instanceMode?: NmxAddonInstanceMode
}

export interface AddonContext {
  addonId: string
  nmxStore: typeof nmxStore
}

export interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void | Promise<void>
  unmount(container: HTMLElement): void
}

export interface AddonModule {
  manifest: NmxAddonManifest
  entry: AddonEntry
}
