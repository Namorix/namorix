import type { Store } from "@reduxjs/toolkit"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { nmxStore } from "../store"
import type { UserRole } from "../types"
import React from "react"

export type NmxAddonIconType = NmxIconSvgSymbol

export const NmxAddonId = {
  about: "about",
  logViewer: "log-viewer",
  settings: "settings",
  systemMonitor: "system-monitor",
  networkTraffic: "network-traffic",
  fileManager: "file-manager",
  terminal: "terminal",
  packageCenter: "package-center",
} as const

export type NmxAddonId = (typeof NmxAddonId)[keyof typeof NmxAddonId]

export const NmxAddonLocaleKeys = {
  about: "about",
  logViewer: "logViewer",
  settings: "settings",
  systemMonitor: "systemMonitor",
  networkTraffic: "networkTraffic",
  fileManager: "fileManager",
  terminal: "terminal",
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
  name: string
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
  nmxStore?: typeof nmxStore
  store?: Store

  isExternal?: boolean
  containerUrl?: string
  sendCommand?: (command: string, payload?: unknown) => Promise<unknown>
}

export interface AddonEntry {
  mount(container: HTMLElement, context: AddonContext): void | Promise<void>
  unmount(container: HTMLElement): void
}

export interface AddonModule {
  manifest: NmxAddonManifest
  entry: AddonEntry
  globalComponent?: React.ComponentType
}

export interface ExternalAddonManifest extends NmxAddonManifest {
  image?: string
  hostPort?: number
  status?: AddonContainerStatus
  version?: string
  author?: string
  installedAt?: string
  pendingTaskId?: string
}

export type AddonContainerStatus =
  | "installing"
  | "installed"
  | "starting"
  | "running"
  | "stopped"
  | "error"
  | "uninstalling"

export interface InstallAddonRequest {
  image: string
  port?: number
  name?: string
  description?: string
  icon?: string
}

export interface AddonCatalogEntry {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  category?: string
  icon?: string
  repo?: string
  license?: string
  image: string
  imageTag?: string
  arch?: string[]
  ports?: {
    container: number
    protocol?: string
    description?: string
  }[]
  boot?: string
  minCoreVersion?: string
  minServerVersion?: string
  manifestUrl: string
  cachedAt: string
}

export interface AddonStatusPayload {
  addonId: string
  status: AddonContainerStatus
}
