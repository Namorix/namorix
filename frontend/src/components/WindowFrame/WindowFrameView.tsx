import React from "react"
import type { WindowFrameViewProps } from "./WindowFrame.types"
import { cx } from "@namorix/ui"
import { WindowResizeHandles } from "./WindowResizeHandles"
import { WindowTitleBar } from "./WindowTitleBar"

export const WindowFrameView: React.FC<WindowFrameViewProps> = ({
  win,
  geo,
  animState,
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
    animState === "opening"
      ? openOrigin
      : animState === "minimizing" || animState === "restoring"
        ? minimizeOrigin
        : `${geo.x + geo.width / 2}px ${geo.y + geo.height / 2}px`

  return (
    <div
      ref={frameRef}
      className={cx("nmx-window-frame", {
        "nmx-window-frame--maximized": win.maximized,
        "nmx-window-frame--focused": win.focused,
        "nmx-window-frame--opening":
          animState === "opening" || animState === "restoring",
        "nmx-window-frame--closing": animState === "closing",
        "nmx-window-frame--minimizing": animState === "minimizing",
        "nmx-window-frame--maximizing": animState === "maximizing",
        "nmx-window-frame--unmaximizing": animState === "unmaximizing",
      })}
      style={{
        transform: win.maximized ? "none" : `translate(${geo.x}px, ${geo.y}px)`,
        width: win.maximized ? "100%" : geo.width,
        height: win.maximized ? "100%" : geo.height,
        zIndex: win.zIndex,
        display: win.minimized && animState === "idle" ? "none" : undefined,
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
