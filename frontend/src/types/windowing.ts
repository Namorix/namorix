import type { NmxAddonIconType } from "@namorix/core"

export type WindowId = string

export interface WindowState {
  id: WindowId
  app: string
  title: string
  icon?: NmxAddonIconType
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  preMaximizeX?: number
  preMaximizeY?: number
  focused: boolean
  zIndex: number
}
