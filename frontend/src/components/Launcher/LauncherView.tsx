import React from "react"
import { NmxIconFont, NmxIconFontSymbol, NmxIconSvg } from "@namorix/ui"
import type { AddonItem, OnOpenApp } from "../../types"
import { type User } from "@namorix/core"

interface LauncherViewProps {
  items: AddonItem[]
  query: string
  user?: User | null
  onQueryChange: (query: string) => void
  onClearQuery: () => void
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
  onClearQuery,
  onLogout,
  onOpenApp,
  onClose,
  searchRef,
}) => {
  return (
    <div className="nmx-launcher-overlay" onMouseDown={onClose}>
      <div className="nmx-launcher" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nmx-launcher__search-wrap">
          <NmxIconFont
            symbol={NmxIconFontSymbol.SEARCH}
            className="nmx-launcher__search-icon"
          />
          <input
            ref={searchRef}
            className="nmx-launcher__search"
            type="text"
            placeholder="Search apps..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              className="nmx-launcher__search-clear"
              onMouseDown={onClearQuery}
              type="button"
              aria-label="Clear"
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.CLOSE}
                className="nmx-launcher__search-clear-icon"
              />
            </button>
          )}
        </div>

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
                    item.icon,
                    rect,
                    item.defaultWidth,
                    item.defaultHeight,
                    item.preferFullSize,
                  )
                }}
              >
                <NmxIconSvg symbol={item.icon} className="nmx-launcher__icon" />
                <span className="nmx-launcher__label">{item.displayName}</span>
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
