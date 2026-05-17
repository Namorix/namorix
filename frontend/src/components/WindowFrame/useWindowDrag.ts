import { useWindowsStore } from "../../stores"
import React, { useCallback, useRef } from "react"
import { useShallow } from "zustand/react/shallow"

export const useWindowDrag = (
  winId: string,
  frameRef: React.RefObject<HTMLDivElement | null>,
) => {
  const { focusWindow, moveWindow } = useWindowsStore(
    useShallow((state) => ({
      focusWindow: state.focusWindow,
      moveWindow: state.moveWindow,
    })),
  )

  const dragRef = useRef<{
    startX: number
    startY: number
    winX: number
    winY: number
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
      }

      document.body.style.userSelect = "none"

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current || !frameRef.current) {
          return
        }

        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        const x = dragRef.current.winX + dx
        const y = dragRef.current.winY + dy

        frameRef.current.style.transform = `translate(${x}px, ${y}px`
      }

      const onUp = (ev: MouseEvent) => {
        if (dragRef.current && frameRef.current) {
          const dx = ev.clientX - dragRef.current.startX
          const dy = ev.clientY - dragRef.current.startY

          moveWindow(
            winId,
            dragRef.current.winX + dx,
            dragRef.current.winY + dy,
          )
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
