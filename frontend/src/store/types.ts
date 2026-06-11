import type { AddonItem } from "../types"

export type WindowId = string

export type AnimState =
  | "opening"
  | "idle"
  | "closing"
  | "minimizing"
  | "restoring"
  | "maximizing"
  | "unmaximizing"

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowData extends WindowRect {
  id: WindowId
  item: AddonItem
  minimized: boolean
  maximized: boolean
  focused: boolean
  animState: AnimState
  preMaximize: WindowRect | null
  originRect: WindowRect | null
}
