import { useWindowsStore } from "../../stores"
import React, { useCallback, useRef } from "react"

export const useWindowResize = (winId: string) => {
  const { moveWindow, resizeWindow } = useWindowsStore()

  const resizingRef = useRef<{
    edge: string
    startX: number
    startY: number
    winX: number
    winY: number
    winWidth: number
    winHeight: number
  } | null>(null)

  const onResizeStart = useCallback(
    (edge: string) => (e: React.MouseEvent) => {
      e.stopPropagation()

      const rect = (
        e.currentTarget.closest(".nmx-window-frame") as HTMLElement
      ).getBoundingClientRect()

      resizingRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        winX: rect.left,
        winY: rect.top,
        winWidth: rect.width,
        winHeight: rect.height,
      }

      const onMove = (ev: MouseEvent) => {
        if (!resizingRef.current) {
          return
        }

        const { edge, startX, startY, winX, winY, winWidth, winHeight } =
          resizingRef.current
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        let x = winX
        let y = winY
        let width = winWidth
        let height = winHeight

        if (edge.includes("e")) width = Math.max(200, winWidth + dx)
        if (edge.includes("s")) height = Math.max(200, winHeight + dy)

        if (edge.includes("w")) {
          x = winX + dx
          width = Math.max(200, winWidth - dx)
        }

        if (edge.includes("n")) {
          y = winY + dy
          height = Math.max(200, winHeight - dy)
        }

        moveWindow(winId, x, y)
        resizeWindow(winId, width, height)
      }

      const onUp = () => {
        resizingRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [winId, moveWindow, resizeWindow],
  )

  return { onResizeStart }
}
