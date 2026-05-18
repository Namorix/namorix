import type { NmxAddonIconType } from "@namorix/core"

export type WindowId = string
export type WindowRectType = {
  x: number
  y: number
  width: number
  height: number
}

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
  preMaximizeWidth?: number
  preMaximizeHeight?: number
  originRect?: WindowRectType
}

export const rectToOrigin = (rect: DOMRect): WindowRectType => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
})
