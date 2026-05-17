import React from "react"
import type { LauncherViewProps } from "./Launcher.types"
import { NmxIconFont, NmxIconFontSymbol, NmxIconSvg } from "@namorix/ui"

export const LauncherView: React.FC<
  LauncherViewProps & { onClose: () => void }
> = ({
  items,
  query,
  onQueryChange,
  onClearQuery,
  onOpenApp,
  onClose,
  searchRef,
}) => (
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
              onMouseDown={() =>
                onOpenApp(item.id, item.displayName, item.icon)
              }
            >
              <NmxIconSvg symbol={item.icon} className="nmx-launcher__icon" />
              <span className="nmx-launcher__label">{item.displayName}</span>
            </button>
          ))
        ) : (
          <p className="nmx-launcher__empty">No app found</p>
        )}
      </div>
    </div>
  </div>
)
