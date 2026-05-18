import React from "react"
import type { WindowFrameViewProps } from "./WindowFrame.types"
import { cx } from "@namorix/ui"
import { WindowResizeHandles } from "./WindowResizeHandles"
import { WindowTitleBar } from "./WindowTitleBar"

export const WindowFrameView: React.FC<WindowFrameViewProps> = ({
  win,
  geo,
  mountRef,
  frameRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onTitleBarMouseDown,
  onResizeStart,
}) => (
  <div
    ref={frameRef}
    className={cx("nmx-window-frame", {
      "nmx-window-frame--maximized": win.maximized,
      "nmx-window-frame--focused": win.focused,
    })}
    style={{
      transform: win.maximized ? "none" : `translate(${geo.x}px, ${geo.y}px`,
      width: win.maximized ? "100%" : geo.width,
      height: win.maximized ? "100%" : geo.height,
      zIndex: win.zIndex,
      display: win.minimized ? "none" : undefined,
    }}
    onMouseDown={onFocus}
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
