import React, { useCallback, useRef } from "react"
import { useShallow } from "zustand/react/shallow"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"

const CURSOR_MAP: Record<string, string> = {
  n: "n-resize",
  s: "s-resize",
  e: "e-resize",
  w: "w-resize",
  ne: "ne-resize",
  nw: "nw-resize",
  se: "se-resize",
  sw: "sw-resize",
}

const calcBounds = (
  edge: string,
  dx: number,
  dy: number,
  winX: number,
  winY: number,
  winWidth: number,
  winHeight: number,
) => {
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

  return { x, y, width, height }
}

export const useWindowResize = (
  winId: string,
  frameRef: React.RefObject<HTMLDivElement | null>,
) => {
  const { moveWindow, resizeWindow } = useWindowGeometryStore(
    useShallow((state) => ({
      moveWindow: state.moveWindow,
      resizeWindow: state.resizeWindow,
    })),
  )

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
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      const edge = e.currentTarget.dataset.edge!
      const rect = frameRef.current!.getBoundingClientRect()

      resizingRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        winX: rect.left,
        winY: rect.top,
        winWidth: rect.width,
        winHeight: rect.height,
      }

      document.body.style.userSelect = "none"

      const overlay = document.createElement("div")
      overlay.style.cssText =
        "position: fixed;" +
        "inset: 0;" +
        "z-index: 999999;" +
        `cursor: ${CURSOR_MAP[edge]};`
      document.body.appendChild(overlay)

      const onMove = (ev: MouseEvent) => {
        if (!resizingRef.current || !frameRef.current) {
          return
        }

        const { edge, startX, startY, winX, winY, winWidth, winHeight } =
          resizingRef.current
        const { x, y, width, height } = calcBounds(
          edge,
          ev.clientX - startX,
          ev.clientY - startY,
          winX,
          winY,
          winWidth,
          winHeight,
        )

        frameRef.current.style.transform = `translate(${x}px, ${y}px)`
        frameRef.current.style.width = `${width}px`
        frameRef.current.style.height = `${height}px`
      }

      const onUp = (ev: MouseEvent) => {
        if (resizingRef.current && frameRef.current) {
          const { edge, startX, startY, winX, winY, winWidth, winHeight } =
            resizingRef.current
          const { x, y, width, height } = calcBounds(
            edge,
            ev.clientX - startX,
            ev.clientY - startY,
            winX,
            winY,
            winWidth,
            winHeight,
          )

          moveWindow(winId, x, y)
          resizeWindow(winId, width, height)
        }

        resizingRef.current = null
        document.body.style.userSelect = ""
        overlay.remove()

        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [winId, moveWindow, resizeWindow, frameRef],
  )

  return { onResizeStart }
}
