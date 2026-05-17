import { useWindowsStore } from "../../stores"
import React, { useCallback, useRef } from "react"

export const useWindowDrag = (winId: string) => {
  const { focusWindow, moveWindow } = useWindowsStore()

  const dragRef = useRef<{
    startX: number
    startY: number
    winX: number
    winY: number
  } | null>(null)

  const onTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      focusWindow(winId)

      console.log("Title")
      const rect = (
        e.currentTarget.closest(".nmx-window-frame") as HTMLElement
      ).getBoundingClientRect()

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        winX: rect.left,
        winY: rect.top,
      }

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) {
          return
        }

        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        moveWindow(winId, dragRef.current.winX + dx, dragRef.current.winY + dy)
      }

      const onUp = () => {
        console.log("onUp")
        dragRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [winId, focusWindow, moveWindow],
  )

  return { onTitleBarMouseDown }
}
