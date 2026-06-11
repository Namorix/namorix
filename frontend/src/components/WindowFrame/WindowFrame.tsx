import React, { useRef } from "react"
import type { WindowFrameProps } from "./WindowFrame.types"
import { WindowFrameView } from "./WindowFrameView"
import {
  selectorAppRect,
  selectorById,
  selectorZIndex,
  useAppSelector,
} from "../../store"
import {
  useAddonMount,
  useWindowAnimVars,
  useWindowDrag,
  useWindowHandlers,
  useWindowOrigins,
  useWindowResize,
} from "./hooks"

export const WindowFrame: React.FC<WindowFrameProps> = ({ winId }) => {
  const win = useAppSelector(selectorById(winId))
  const zIndex = useAppSelector(selectorZIndex(winId))
  const taskbarRect = useAppSelector(selectorAppRect(winId))
  const { openOrigin, minimizeOrigin } = useWindowOrigins(win, taskbarRect)
  const { maximizeVars, unmaximizeVars } = useWindowAnimVars(win)

  const frameRef = useRef<HTMLDivElement>(null)
  const { onTitleBarMouseDown } = useWindowDrag(winId, frameRef)
  const { onResizeStart } = useWindowResize(winId, frameRef)
  const { mountRef } = useAddonMount(win?.item.id ?? winId)
  const handlers = useWindowHandlers(winId, win, frameRef)

  if (!win) {
    return null
  }

  return (
    <WindowFrameView
      win={win}
      zIndex={zIndex}
      openOrigin={openOrigin}
      minimizeOrigin={minimizeOrigin}
      maximizeVars={maximizeVars}
      unmaximizeVars={unmaximizeVars}
      mountRef={mountRef}
      frameRef={frameRef}
      onFocus={handlers.onFocus}
      onClose={handlers.onClose}
      onMinimize={handlers.onMinimize}
      onMaximize={handlers.onMaximize}
      onRestore={handlers.onRestore}
      onTitleBarMouseDown={onTitleBarMouseDown}
      onResizeStart={onResizeStart}
      onAnimationEnd={handlers.onAnimationEnd}
    />
  )
}
