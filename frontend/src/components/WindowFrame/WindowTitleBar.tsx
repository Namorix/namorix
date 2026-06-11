import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  type NmxIconSvgSymbol,
} from "@namorix/ui"
import React, { memo } from "react"
import { useTranslation } from "react-i18next"
import { resolveAddonLocaleTitleByKey } from "../../utils"
import type { NmxAddonLocaleKeys } from "@namorix/core"
import { useDoubleTap } from "@namorix/core/hooks/useDoubleTap"

interface WindowTitleBarProps {
  title: string
  localeKey?: NmxAddonLocaleKeys
  icon?: NmxIconSvgSymbol
  maximized: boolean
  showMaximized?: boolean
  onTitleBarMouseDown: React.MouseEventHandler<HTMLDivElement>
  onMinimize: () => void
  onMaximize: () => void
  onRestore: (clientX?: number, clientY?: number) => void
  onClose: () => void
}

export const WindowTitleBar = memo(
  ({
    title,
    localeKey,
    icon,
    maximized,
    showMaximized,
    onTitleBarMouseDown,
    onMinimize,
    onMaximize,
    onRestore,
    onClose,
  }: WindowTitleBarProps) => {
    const { t } = useTranslation()

    const handleDoubleClick = useDoubleTap((e: React.MouseEvent) => {
      e.stopPropagation()
      if (maximized) {
        onRestore(e.clientX, e.clientY)
      } else {
        onMaximize()
      }
    })

    return (
      <div
        className="nmx-window-frame__titlebar"
        onMouseDown={onTitleBarMouseDown}
        onClick={handleDoubleClick}
      >
        {icon && (
          <NmxIconSvg symbol={icon} className="nmx-window-frame__app-icon" />
        )}
        <span className="nmx-window-frame__title">
          {resolveAddonLocaleTitleByKey(t, localeKey) ?? title}
        </span>
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

          {showMaximized !== false && (
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
                  maximized
                    ? NmxIconFontSymbol.RESTORE
                    : NmxIconFontSymbol.MAXIMIZE
                }
                className="nmx-window-frame__btn-icon"
              />
            </button>
          )}

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
    )
  },
)

WindowTitleBar.displayName = "WindowTitleBar"
