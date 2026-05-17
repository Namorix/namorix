import type { WindowState } from "../../types"
import React from "react"

export interface WindowFrameProps {
  win: WindowState
}

export interface WindowFrameViewProps extends WindowFrameProps {
  frameRef: React.RefObject<HTMLDivElement | null>
  mountRef: React.RefObject<HTMLDivElement | null>
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onRestore: () => void
  onTitleBarMouseDown: (e: React.MouseEvent) => void
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>) => void
}
