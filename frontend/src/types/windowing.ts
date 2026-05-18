import type { NmxAddonIconType } from "@namorix/core"

export type WindowId = string

export interface WindowState {
  id: WindowId
  app: string
  title: string
  icon?: NmxAddonIconType
  minimized: boolean
  maximized: boolean
  focused: boolean
  zIndex: number
}

export interface WindowGeometry {
  id: WindowId
  x: number
  y: number
  width: number
  height: number
  preMaximizeX?: number
  preMaximizeY?: number
}
