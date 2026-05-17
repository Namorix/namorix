import React, { useCallback, useRef } from "react"
import { useWindowsStore } from "../../stores"
import type { WindowFrameProps } from "./WindowFrame.types"
import { useWindowDrag } from "./useWindowDrag"
import { useWindowResize } from "./useWindowResize"
import { useAddonMount } from "./useAddonMount"
import { WindowFrameView } from "./WindowFrameView"
import { useShallow } from "zustand/react/shallow"

export const WindowFrame: React.FC<WindowFrameProps> = ({ win }) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    moveWindow,
  } = useWindowsStore(
    useShallow((state) => ({
      focusWindow: state.focusWindow,
      closeWindow: state.closeWindow,
      minimizeWindow: state.minimizeWindow,
      maximizeWindow: state.maximizeWindow,
      restoreWindow: state.restoreWindow,
      moveWindow: state.moveWindow,
    })),
  )

  const frameRef = useRef<HTMLDivElement>(null)

  const { onTitleBarMouseDown } = useWindowDrag(win.id, frameRef)
  const { onResizeStart } = useWindowResize(win.id, frameRef)
  const { mountRef } = useAddonMount(win.id)

  const handleMaximize = useCallback(() => {
    if (!frameRef.current) {
      return null
    }

    const rect = frameRef.current.getBoundingClientRect()
    moveWindow(win.id, rect.left, rect.top)
    maximizeWindow(win.id)
  }, [win.id, frameRef, moveWindow, maximizeWindow])

  const handleFocus = useCallback(
    () => focusWindow(win.id),
    [focusWindow, win.id],
  )
  const handleClose = useCallback(
    () => closeWindow(win.id),
    [closeWindow, win.id],
  )
  const handleMinimize = useCallback(
    () => minimizeWindow(win.id),
    [minimizeWindow, win.id],
  )
  const handleRestore = useCallback(
    () => restoreWindow(win.id),
    [restoreWindow, win.id],
  )

  return (
    <WindowFrameView
      win={win}
      mountRef={mountRef}
      frameRef={frameRef}
      onFocus={handleFocus}
      onClose={handleClose}
      onMinimize={handleMinimize}
      onMaximize={handleMaximize}
      onRestore={handleRestore}
      onTitleBarMouseDown={onTitleBarMouseDown}
      onResizeStart={onResizeStart}
    />
  )
}
