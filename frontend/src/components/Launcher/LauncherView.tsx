import React from "react"
import { NmxIconFont, NmxIconFontSymbol, NmxIconSvg } from "@namorix/ui"
import type { AddonItem, OnOpenApp } from "../../types"
import { NMX_NAME, type User } from "@namorix/core"
import { useTranslation } from "react-i18next"
import { resolveAddonLocaleTitle } from "../../utils"

interface LauncherViewProps {
  items: AddonItem[]
  user?: User | null
  onLogout: () => void
  onOpenApp: OnOpenApp
}

export const LauncherView: React.FC<
  LauncherViewProps & { onClose: () => void }
> = ({ items, user, onLogout, onOpenApp, onClose }) => {
  const { t } = useTranslation()

  return (
    <div className="nmx-launcher-overlay" onMouseDown={onClose}>
      <div className="nmx-launcher" onMouseDown={(e) => e.stopPropagation()}>
        <span className="nmx-launcher__head">{NMX_NAME}</span>
        <div className="nmx-launcher__grid">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={item.id}
                className="nmx-launcher__item"
                type="button"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  onOpenApp(item, rect)
                }}
              >
                <NmxIconSvg symbol={item.icon} className="nmx-launcher__icon" />
                <span className="nmx-launcher__label">
                  {resolveAddonLocaleTitle(t, item) ?? item.name}
                </span>
              </button>
            ))
          ) : (
            <p className="nmx-launcher__empty">No app found</p>
          )}
        </div>

        <div className="nmx-launcher__footer">
          <div className="nmx-launcher__footer__info">
            <span className="nmx-launcher__footer__info-user">
              {user?.username}
            </span>
          </div>

          <div className="nmx-launcher__footer__actions">
            <button
              className="nmx-launcher__logout-btn"
              type="button"
              onMouseDown={onLogout}
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.EXIT}
                className="nmx-launcher__logout-icon"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
