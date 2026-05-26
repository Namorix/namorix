import type { NmxIconSvgSymbol } from "@namorix/ui"
import type { LocaleKeys } from "@namorix/core"

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
  app: string
  title: string
  localeKey?: LocaleKeys
  icon?: NmxIconSvgSymbol
  minimized: boolean
  maximized: boolean
  focused: boolean
  animState: AnimState
  preMaximize: WindowRect | null
  originRect: WindowRect | null
}
