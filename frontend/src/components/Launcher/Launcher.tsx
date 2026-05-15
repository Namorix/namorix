import React from "react"
import { useWindowsStore } from "../../stores/window.store"
import { useLauncherStore } from "../../stores/launcher.store"
import { useShallow } from "zustand/react/shallow"
import "./Launcher.scss"
import { listAddons } from "../../addons"

export const Launcher: React.FC = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  const { isOpen, close } = useLauncherStore(
    useShallow((state) => ({ isOpen: state.isOpen, close: state.close })),
  )

  const handlerLauncher = (app: string, label: string) => {
    openWindow(app, label)
    close()
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="nmx-launcher-overlay" onMouseDown={close}>
      <div className="nmx-launcher" onMouseDown={(e) => e.stopPropagation()}>
        {listAddons().map((addon) => (
          <button
            key={addon.manifest.id}
            className="nmx-launcher__item"
            type="button"
            onMouseDown={() =>
              handlerLauncher(addon.manifest.id, addon.manifest.displayName)
            }
          >
            <span className="nmx-launcher__icon">{addon.manifest.icon}</span>
            <span className="nmx-launcher__label">
              {addon.manifest.displayName}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
