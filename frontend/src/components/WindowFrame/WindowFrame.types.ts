import type { WindowState } from "../../types"
import React from "react"
import type { WindowGeometry } from "../../types/windowing"

export type AnimState =
  | "opening"
  | "idle"
  | "closing"
  | "minimizing"
  | "restoring"
  | "maximizing"
  | "unmaximizing"

export interface WindowFrameProps {
  win: WindowState
}

export interface WindowFrameViewProps extends WindowFrameProps {
  geo: WindowGeometry
  animState: AnimState
  openOrigin: string
  minimizeOrigin: string
  maximizeVars?: React.CSSProperties
  unmaximizeVars?: React.CSSProperties
  frameRef: React.RefObject<HTMLDivElement | null>
  mountRef: React.RefObject<HTMLDivElement | null>
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onRestore: () => void
  onTitleBarMouseDown: (e: React.MouseEvent) => void
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
  onAnimationEnd: () => void
}
