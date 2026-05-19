import React, { useCallback, useRef } from "react"
import {
  focusWindow,
  moveWindow,
  restoreWindow,
  store,
  useAppDispatch,
  type WindowId,
} from "../../store"
import { getWindowDefaults } from "../../config"

const clamp = (x: number, y: number, winWidth: number) => {
  const dragMinVisible = getWindowDefaults().dragMinVisible

  return {
    x: Math.max(
      -(winWidth - dragMinVisible),
      Math.min(window.innerWidth - dragMinVisible, x),
    ),
    y: Math.max(0, Math.min(window.innerHeight - dragMinVisible, y)),
  }
}

export const useWindowDrag = (
  winId: WindowId,
  frameRef: React.RefObject<HTMLDivElement | null>,
) => {
  const dispatch = useAppDispatch()

  const dragRef = useRef<{
    startX: number
    startY: number
    winX: number
    winY: number
    winWidth: number
  } | null>(null)

  const onTitleBarMouseDown = useCallback(
    (downEv: React.MouseEvent) => {
      dispatch(focusWindow(winId))

      if (!frameRef.current) {
        return
      }

      const win = store.getState().windowsState.byId[winId]
      const isMaximized = win?.maximized ?? false

      if (!isMaximized) {
        const rect = frameRef.current.getBoundingClientRect()
        dragRef.current = {
          startX: downEv.clientX,
          startY: downEv.clientY,
          winX: rect.left,
          winY: rect.top,
          winWidth: rect.width,
        }
      }

      document.body.style.userSelect = "none"

      const onMove = (ev: MouseEvent) => {
        if (!frameRef.current) {
          return
        }

        const currentWin = store.getState().windowsState.byId[winId]
        const stillMaximized = currentWin?.maximized ?? false
        const pre = currentWin?.preMaximize

        if (stillMaximized && pre) {
          const { dragThreshold, titleBarCursorOffset } = getWindowDefaults()
          const dx = ev.clientX - downEv.clientX
          const dy = ev.clientY - downEv.clientY

          if (Math.abs(dx) < dragThreshold && Math.abs(dy) < dragThreshold) {
            return
          }

          dispatch(restoreWindow(winId))

          const ratioX = downEv.clientX / window.innerWidth
          const targetX = ev.clientX - pre.width * ratioX
          const targetY = ev.clientY - titleBarCursorOffset

          dispatch(moveWindow({ id: winId, x: targetX, y: targetY }))

          dragRef.current = {
            startX: ev.clientX,
            startY: ev.clientY,
            winX: targetX,
            winY: targetY,
            winWidth: pre.width,
          }

          frameRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`
          return
        }

        if (!dragRef.current) {
          return
        }

        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        const { x, y } = clamp(
          dragRef.current.winX + dx,
          dragRef.current.winY + dy,
          dragRef.current.winWidth,
        )

        frameRef.current.style.transform = `translate(${x}px, ${y}px)`
      }

      const onUp = (ev: MouseEvent) => {
        if (dragRef.current && frameRef.current) {
          const dx = ev.clientX - dragRef.current.startX
          const dy = ev.clientY - dragRef.current.startY
          const { x, y } = clamp(
            dragRef.current.winX + dx,
            dragRef.current.winY + dy,
            dragRef.current.winWidth,
          )

          dispatch(moveWindow({ id: winId, x, y }))
        }

        dragRef.current = null
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [dispatch, winId, frameRef],
  )

  return { onTitleBarMouseDown }
}
