import React, { useCallback, useRef } from "react"
import { useWindowsStore } from "../../stores"
import type { WindowFrameProps } from "./WindowFrame.types"
import { useWindowDrag } from "./useWindowDrag"
import { useWindowResize } from "./useWindowResize"
import { useAddonMount } from "./useAddonMount"
import { WindowFrameView } from "./WindowFrameView"
import { useShallow } from "zustand/react/shallow"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"
import { useTaskbarRectStore } from "./useTaskbarRectStore"

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

  const animState = useWindowsStore(
    (state) => state.animStates[win.id] ?? "opening",
  )
  const setAnimState = useWindowsStore((state) => state.setAnimState)

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

  const handleAnimationEnd = useCallback(() => {
    if (animState === "opening" || animState === "restoring") {
      setAnimState(win.id, "idle")
    } else if (animState === "closing") {
      closeWindow(win.id)
      removeGeometry(win.id)
    } else if (animState === "maximizing") {
      maximizeWindow(win.id)
      setAnimState(win.id, "idle")
    } else if (animState === "unmaximizing") {
      const pre = useWindowGeometryStore.getState().getPreMaximize(win.id)
      if (pre) {
        moveWindow(win.id, pre.x, pre.y)
      }
      restoreWindow(win.id)
      setAnimState(win.id, "idle")
    } else {
      minimizeWindow(win.id)
      setAnimState(win.id, "idle")
    }
  }, [
    animState,
    setAnimState,
    win.id,
    closeWindow,
    removeGeometry,
    minimizeWindow,
  ])

  const handleMaximize = useCallback(() => {
    if (!frameRef.current) {
      return null
    }

    const rect = frameRef.current.getBoundingClientRect()
    savePreMaximize(win.id, rect.left, rect.top, rect.width, rect.height)
    setAnimState(win.id, "maximizing")
  }, [savePreMaximize, win.id, setAnimState])

  const handleFocus = useCallback(
    () => focusWindow(win.id),
    [focusWindow, win.id],
  )

  const handleClose = useCallback(() => {
    setAnimState(win.id, "closing")
  }, [setAnimState, win.id])

  const handleMinimize = useCallback(() => {
    setAnimState(win.id, "minimizing")
  }, [setAnimState, win.id])

  const handleRestore = useCallback(() => {
    setAnimState(win.id, "unmaximizing")
  }, [setAnimState, win.id])

  if (!geo) {
    return null
  }

  const taskbarRect = useTaskbarRectStore.getState().getRect(win.id)

  const openOrigin = geo.originRect
    ? `${geo.originRect.x + geo.originRect.width / 2}px ${geo.originRect.y + geo.originRect.height / 2}px`
    : "center center"

  const minimizeOrigin = taskbarRect
    ? `${taskbarRect.x + taskbarRect.width / 2}px ${taskbarRect.y + taskbarRect.height / 2}px`
    : "center bottom"

  const maximizeVars =
    animState === "maximizing"
      ? ({
          "--nmx-scale-x": window.innerWidth / geo.width,
          "--nmx-scale-y": window.innerHeight / geo.height,
          "--nmx-translate-x": `${window.innerWidth / 2 - (geo.x + geo.width / 2)}px`,
          "--nmx-translate-y": `${window.innerHeight / 2 - (geo.y + geo.height) / 2}px`,
        } as React.CSSProperties)
      : undefined

  const pre = useWindowGeometryStore.getState().getPreMaximize(win.id)

  const unmaximizeVars =
    animState === "unmaximizing" && pre
      ? ({
          "--nmx-scale-x": pre.width / window.innerWidth,
          "--nmx-scale-y": pre.height / window.innerHeight,
          "--nmx-translate-x": `${pre.x + pre.width / 2 - window.innerWidth / 2}px`,
          "--nmx-translate-y": `${pre.y + pre.height / 2 - window.innerHeight / 2}px`,
        } as React.CSSProperties)
      : undefined

  return (
    <WindowFrameView
      win={win}
      geo={geo}
      animState={animState}
      openOrigin={openOrigin}
      minimizeOrigin={minimizeOrigin}
      maximizeVars={maximizeVars}
      unmaximizeVars={unmaximizeVars}
      mountRef={mountRef}
      frameRef={frameRef}
      onFocus={handleFocus}
      onClose={handleClose}
      onMinimize={handleMinimize}
      onMaximize={handleMaximize}
      onRestore={handleRestore}
      onTitleBarMouseDown={onTitleBarMouseDown}
      onResizeStart={onResizeStart}
      onAnimationEnd={handleAnimationEnd}
    />
  )
}
