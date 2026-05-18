import React, { useCallback, useRef } from "react"
import { useWindowsStore } from "../../stores"
import type { WindowFrameProps } from "./WindowFrame.types"
import { useWindowDrag } from "./useWindowDrag"
import { useWindowResize } from "./useWindowResize"
import { useAddonMount } from "./useAddonMount"
import { WindowFrameView } from "./WindowFrameView"
import { useShallow } from "zustand/react/shallow"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"

export const WindowFrame: React.FC<WindowFrameProps> = ({ win }) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
  } = useWindowsStore(
    useShallow((state) => ({
      focusWindow: state.focusWindow,
      closeWindow: state.closeWindow,
      minimizeWindow: state.minimizeWindow,
      maximizeWindow: state.maximizeWindow,
      restoreWindow: state.restoreWindow,
    })),
  )

  const geo = useWindowGeometryStore(
    (state) => state.geometry.find((g) => g.id === win.id) ?? null,
  )

  const { removeGeometry, savePreMaximize, moveWindow } =
    useWindowGeometryStore(
      useShallow((state) => ({
        removeGeometry: state.removeGeometry,
        savePreMaximize: state.savePreMaximize,
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
    savePreMaximize(win.id, rect.left, rect.top)
    maximizeWindow(win.id)
  }, [win.id, frameRef, savePreMaximize, maximizeWindow])

  const handleFocus = useCallback(
    () => focusWindow(win.id),
    [focusWindow, win.id],
  )
  const handleClose = useCallback(() => {
    closeWindow(win.id)
    removeGeometry(win.id)
  }, [closeWindow, removeGeometry, win.id])
  const handleMinimize = useCallback(
    () => minimizeWindow(win.id),
    [minimizeWindow, win.id],
  )
  const handleRestore = useCallback(() => {
    const pre = useWindowGeometryStore.getState().getPreMaximize(win.id)
    if (pre) {
      moveWindow(win.id, pre.x, pre.y)
    }
    restoreWindow(win.id)
  }, [restoreWindow, moveWindow, win.id])

  if (!geo) {
    return null
  }

  return (
    <WindowFrameView
      win={win}
      geo={geo}
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
