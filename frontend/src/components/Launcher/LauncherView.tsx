import React from "react"
import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxSearchInput,
} from "@namorix/ui"
import type { AddonItem, OnOpenApp } from "../../types"
import { type User } from "@namorix/core"
import { useTranslation } from "react-i18next"
import { resolveAddonLocaleTitle } from "../../utils"

interface LauncherViewProps {
  items: AddonItem[]
  query: string
  user?: User | null
  onQueryChange: (query: string) => void
  onLogout: () => void
  onOpenApp: OnOpenApp
  searchRef: React.RefObject<HTMLInputElement | null>
}

export const LauncherView: React.FC<
  LauncherViewProps & { onClose: () => void }
> = ({
  items,
  query,
  user,
  onQueryChange,
  onLogout,
  onOpenApp,
  onClose,
  searchRef,
}) => {
  const { t } = useTranslation()

  return (
    <div className="nmx-launcher-overlay" onMouseDown={onClose}>
      <div className="nmx-launcher" onMouseDown={(e) => e.stopPropagation()}>
        <NmxSearchInput
          ref={searchRef}
          value={query}
          onChange={onQueryChange}
          placeholder={t("launcher.searchPlaceholder")}
          className="nmx-launcher__search"
        />

        <div className="nmx-launcher__grid">
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={item.id}
                className="nmx-launcher__item"
                type="button"
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  onOpenApp(
                    item.id,
                    item.displayName,
                    item.localeKey,
                    item.icon,
                    rect,
                    item.defaultWidth,
                    item.defaultHeight,
                    item.preferFullSize,
                  )
                }}
              >
                <NmxIconSvg symbol={item.icon} className="nmx-launcher__icon" />
                <span className="nmx-launcher__label">
                  {resolveAddonLocaleTitle(t, item) ?? item.displayName}
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
