import React from "react"
import type { WindowData, WindowId } from "../../store"

export interface WindowFrameProps {
  winId: WindowId
}

export interface WindowFrameViewProps {
  win: WindowData
  zIndex: number
  openOrigin?: string
  minimizeOrigin?: string
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
