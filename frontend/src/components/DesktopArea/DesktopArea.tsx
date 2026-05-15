import React from "react"
import "./DesktopArea.scss"
import { useWindowsStore } from "../../stores/window.store"
import { listAddons } from "../../addons"

export const DesktopArea: React.FC = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  return (
    <div className="nmx-desktop-area">
      <div className="nmx-desktop-area__grid">
        {listAddons().map((addon) => (
          <button
            key={addon.manifest.id}
            className="nmx-desktop-area__icon"
            type="button"
            onDoubleClick={() =>
              openWindow(addon.manifest.id, addon.manifest.displayName)
            }
          >
            <span className="nmx-desktop-area__icon-img">
              {addon.manifest.icon}
            </span>
            <span className="nmx-desktop-area__icon-label">
              {addon.manifest.displayName}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
