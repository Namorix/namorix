import "./WindowFrame.scss"
import type { WindowState } from "../../types"
import React, { useCallback, useEffect, useRef } from "react"
import { useWindowsStore } from "../../stores/window.store"
import { type AddonContext } from "@namorix/core"
import { resolveAddon } from "../../addons"
import { cx } from "@namorix/ui"

interface WindowFrameProps {
  win: WindowState
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ win }) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    resizeWindow,
    moveWindow,
  } = useWindowsStore()

  const dragRef = useRef<{
    startX: number
    startY: number
    winX: number
    winY: number
  } | null>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      focusWindow(win.id)

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

        moveWindow(win.id, dragRef.current.winX + dx, dragRef.current.winY + dy)
      }

      const onUp = () => {
        dragRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [win.id, focusWindow, moveWindow],
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
    (edge: string) => (e: React.MouseEvent) => {
      e.stopPropagation()

      const element = e.currentTarget.closest(
        ".nmx-window-frame",
      ) as HTMLElement
      const rect = element.getBoundingClientRect()

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

        moveWindow(win.id, x, y)
        resizeWindow(win.id, width, height)
      }

      const onUp = () => {
        resizingRef.current = null
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [win.id, moveWindow, resizeWindow],
  )

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const addon = resolveAddon(win.app)
    if (!addon) {
      return
    }

    const context: AddonContext = {
      addonId: win.app,
      locale: "en",
      theme: "dark",
    }

    if (containerRef.current) {
      addon.entry.mount(containerRef.current, context)
    }

    return () => {
      addon.entry.unmount()
    }
  }, [win.app])

  return (
    <div
      className={cx("nmx-window-frame", {
        "nmx-window-frame--maximized": win.maximized,
      })}
      style={{
        left: win.maximized ? 0 : win.x,
        top: win.maximized ? 0 : win.y,
        width: win.maximized ? "100%" : win.width,
        height: win.maximized ? "100%" : win.height,
        zIndex: win.zIndex,
        display: win.minimized ? "none" : undefined,
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div
        className="nmx-window-frame__titlebar"
        onMouseDown={onMouseDown}
        onDoubleClick={() => {
          if (win.maximized) {
            restoreWindow(win.id)
          } else {
            maximizeWindow(win.id)
          }
        }}
      >
        <span className="nmx-window-frame__title">{win.title}</span>
        <div className="nmx-window-frame__actions">
          <button
            type="button"
            className="nmx-window-frame__btn"
            onMouseDown={(e) => {
              e.stopPropagation()
              minimizeWindow(win.id)
            }}
          >
            -
          </button>

          <button
            type="button"
            className="nmx-window-frame__btn"
            onMouseDown={(e) => {
              e.stopPropagation()
              if (win.maximized) {
                restoreWindow(win.id)
              } else {
                maximizeWindow(win.id)
              }
            }}
          >
            {win.maximized ? "❐" : "□"}
          </button>

          <button
            type="button"
            className="nmx-window-frame__btn nmx-window-frame__btn--close"
            onMouseDown={(e) => {
              e.stopPropagation()
              closeWindow(win.id)
            }}
          >
            x
          </button>
        </div>
      </div>

      <div className="nmx-window-frame__content">
        <div ref={containerRef} className="nmx-window-frame__mount"></div>
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--n"
          onMouseDown={onResizeStart("n")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--s"
          onMouseDown={onResizeStart("s")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--e"
          onMouseDown={onResizeStart("e")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--w"
          onMouseDown={onResizeStart("w")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--ne"
          onMouseDown={onResizeStart("ne")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--nw"
          onMouseDown={onResizeStart("nw")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--se"
          onMouseDown={onResizeStart("se")}
        />
        <div
          className="nmx-window-frame__resize-handle nmx-window-frame__resize-handle--sw"
          onMouseDown={onResizeStart("sw")}
        />
      </div>
    </div>
  )
}
