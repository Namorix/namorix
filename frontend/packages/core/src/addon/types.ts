import { NmxIconSvgSymbol } from "@namorix/ui"
import { nmxStore } from "../store"
import type { UserRole } from "../types"

export type NmxAddonIconType = NmxIconSvgSymbol

export const LocaleKeys = {
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

export type LocaleKeys = (typeof LocaleKeys)[keyof typeof LocaleKeys]

export interface NmxAddonManifest {
  id: string
  displayName: string
  description?: string
  localeKey?: LocaleKeys
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
  unmount(container: HTMLElement): void
}

export interface AddonModule {
  manifest: NmxAddonManifest
  entry: AddonEntry
}
