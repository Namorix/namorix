import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  type NmxIconSvgSymbol,
} from "@namorix/ui"
import React, { memo } from "react"

interface WindowTitleBarProps {
  title: string
  icon?: NmxIconSvgSymbol
  maximized: boolean
  onTitleBarMouseDown: React.MouseEventHandler<HTMLDivElement>
  onMinimize: () => void
  onMaximize: () => void
  onRestore: () => void
  onClose: () => void
}

export const WindowTitleBar = memo(
  ({
    title,
    icon,
    maximized,
    onTitleBarMouseDown,
    onMinimize,
    onMaximize,
    onRestore,
    onClose,
  }: WindowTitleBarProps) => (
    <div
      className="nmx-window-frame__titlebar"
      onMouseDown={onTitleBarMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation()
        console.log("Maximized: ", maximized)
        if (maximized) {
          onRestore()
        } else {
          onMaximize()
        }
      }}
    >
      {icon && (
        <NmxIconSvg symbol={icon} className="nmx-window-frame__app-icon" />
      )}
      <span className="nmx-window-frame__title">{title}</span>
      <div className="nmx-window-frame__actions">
        <button
          type="button"
          className="nmx-window-frame__btn nmx-window-frame__btn--minimize"
          onMouseDown={(e) => {
            e.stopPropagation()
            onMinimize()
          }}
        >
          <NmxIconFont
            symbol={NmxIconFontSymbol.MINIMIZE}
            className="nmx-window-frame__btn-icon"
          />
        </button>

        <button
          type="button"
          className="nmx-window-frame__btn nmx-window-frame--maximize"
          onMouseDown={(e) => {
            e.stopPropagation()
            return maximized ? onRestore() : onMaximize()
          }}
        >
          <NmxIconFont
            symbol={
              maximized ? NmxIconFontSymbol.MAXIMIZE : NmxIconFontSymbol.RESTORE
            }
            className="nmx-window-frame__btn-icon"
          />
        </button>

        <button
          type="button"
          className="nmx-window-frame__btn nmx-window-frame__btn--close"
          onMouseDown={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <NmxIconFont
            symbol={NmxIconFontSymbol.CLOSE}
            className="nmx-window-frame__btn-icon"
          />
        </button>
      </div>
    </div>
  ),
)

WindowTitleBar.displayName = "WindowTitleBar"
