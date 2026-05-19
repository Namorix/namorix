import React from "react"
import type { WindowFrameViewProps } from "./WindowFrame.types"
import { cx } from "@namorix/ui"
import { WindowResizeHandles } from "./WindowResizeHandles"
import { WindowTitleBar } from "./WindowTitleBar"

export const WindowFrameView: React.FC<WindowFrameViewProps> = ({
  win,
  zIndex,
  openOrigin,
  minimizeOrigin,
  maximizeVars,
  unmaximizeVars,
  mountRef,
  frameRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onTitleBarMouseDown,
  onResizeStart,
  onAnimationEnd,
}) => {
  const transformOrigin =
    win?.animState === "opening"
      ? openOrigin
      : win.animState === "minimizing" || win.animState === "restoring"
        ? minimizeOrigin
        : `${win.x + win.width / 2}px ${win.y + win.height / 2}px`

  return (
    <div
      ref={frameRef}
      className={cx("nmx-window-frame", {
        "nmx-window-frame--maximized": win.maximized,
        "nmx-window-frame--focused": win.focused,
        "nmx-window-frame--opening":
          win.animState === "opening" || win.animState === "restoring",
        "nmx-window-frame--closing": win.animState === "closing",
        "nmx-window-frame--minimizing": win.animState === "minimizing",
        "nmx-window-frame--maximizing": win.animState === "maximizing",
        "nmx-window-frame--unmaximizing": win.animState === "unmaximizing",
      })}
      style={{
        transform: win.maximized ? "none" : `translate(${win.x}px, ${win.y}px)`,
        width: win.maximized ? "100%" : win.width,
        height: win.maximized ? "100%" : win.height,
        zIndex,
        display: win.minimized && win.animState === "idle" ? "none" : undefined,
        transformOrigin,
        ...maximizeVars,
        ...unmaximizeVars,
      }}
      onMouseDown={onFocus}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) onAnimationEnd()
      }}
    >
      <WindowTitleBar
        title={win.title}
        icon={win.icon}
        maximized={win.maximized}
        onTitleBarMouseDown={onTitleBarMouseDown}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onRestore={onRestore}
        onClose={onClose}
      />

      <div className="nmx-window-frame__content">
        <div ref={mountRef} className="nmx-window-frame__mount"></div>
        <WindowResizeHandles onResizeStart={onResizeStart} />
      </div>
    </div>
  )
}
