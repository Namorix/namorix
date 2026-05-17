import React from "react"
import type { WindowFrameProps } from "./WindowFrame.types"
import { cx, NmxIconSvg } from "@namorix/ui"

const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const

export const WindowFrameView: React.FC<WindowFrameProps> = ({
  win,
  mountRef,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onRestore,
  onTitleBarMouseDown,
  onResizeStart,
}) => (
  <div
    className={cx("nmx-window-frame", {
      "nmx-window-frame--maximized": win.maximized,
      "nmx-window-frame--focused": win.focused,
    })}
    style={{
      left: win.maximized ? 0 : win.x,
      top: win.maximized ? 0 : win.y,
      width: win.maximized ? "100%" : win.width,
      height: win.maximized ? "100%" : win.height,
      zIndex: win.zIndex,
      display: win.minimized ? "none" : undefined,
    }}
    onMouseDown={onFocus}
  >
    <div
      className="nmx-window-frame__titlebar"
      onMouseDown={onTitleBarMouseDown}
      onDoubleClick={() => (win.maximized ? onRestore() : onMaximize())}
    >
      {win.icon && (
        <NmxIconSvg
          symbol={win.icon}
          className="nmx-window-frame__title-icon"
        />
      )}
      <span className="nmx-window-frame__title">{win.title}</span>
      <div className="nmx-window-frame__actions">
        <button
          type="button"
          className="nmx-window-frame__btn nmx-window-frame__btn--minimize"
          onMouseDown={(e) => {
            e.stopPropagation()
            onMinimize()
          }}
        >
          -
        </button>

        <button
          type="button"
          className="nmx-window-frame__btn nmx-window-frame--maximize"
          onMouseDown={(e) => {
            e.stopPropagation()
            if (win.maximized) {
              onRestore()
            } else {
              onMaximize()
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
            onClose()
          }}
        >
          x
        </button>
      </div>
    </div>
    <div className="nmx-window-frame__content">
      <div ref={mountRef} className="nmx-window-frame__mount"></div>
      {EDGES.map((edge) => (
        <div
          key={edge}
          className={`nmx-window-frame__resize-handle nmx-window-frame__resize-handle-${edge}`}
          onMouseDown={onResizeStart(edge)}
        />
      ))}
    </div>
  </div>
)
