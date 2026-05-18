import { useWindowsStore } from "../../stores"
import React, { useCallback, useRef } from "react"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"

const clamp = (el: HTMLElement, x: number, y: number, winWidth: number) => {
  const minVisible =
    parseFloat(
      getComputedStyle(el).getPropertyValue("--nmx-window-drag-min-visible"),
    ) || 150

  return {
    x: Math.max(
      -(winWidth - minVisible),
      Math.min(window.innerWidth - minVisible, x),
    ),
    y: Math.max(0, Math.min(window.innerHeight - minVisible, y)),
  }
}

export const useWindowDrag = (
  winId: string,
  frameRef: React.RefObject<HTMLDivElement | null>,
) => {
  const focusWindow = useWindowsStore((state) => state.focusWindow)
  const moveWindow = useWindowGeometryStore((state) => state.moveWindow)

  const dragRef = useRef<{
    startX: number
    startY: number
    winX: number
    winY: number
    winWidth: number
  } | null>(null)

  const onTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      focusWindow(winId)

      if (!frameRef.current) {
        return
      }

      const rect = frameRef.current.getBoundingClientRect()

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        winX: rect.left,
        winY: rect.top,
        winWidth: rect.width,
      }

      document.body.style.userSelect = "none"

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current || !frameRef.current) {
          return
        }

        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        const { x, y } = clamp(
          frameRef.current,
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
            frameRef.current,
            dragRef.current.winX + dx,
            dragRef.current.winY + dy,
            dragRef.current.winWidth,
          )

          moveWindow(winId, x, y)
        }

        dragRef.current = null
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [winId, focusWindow, moveWindow, frameRef],
  )

  return { onTitleBarMouseDown }
}
