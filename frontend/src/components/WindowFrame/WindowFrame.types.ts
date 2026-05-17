import type { WindowState } from "../../types"
import React from "react"

export interface WindowFrameProps {
  win: WindowState
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onRestore: () => void
  onTitleBarMouseDown: (e: React.MouseEvent) => void
  onResizeStart: (edge: string) => (e: React.MouseEvent) => void
  mountRef: React.RefObject<HTMLDivElement | null>
}
