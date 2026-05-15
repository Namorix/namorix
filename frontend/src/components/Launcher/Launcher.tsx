import React from "react"
import { useWindowsStore } from "../../stores/window.store"
import { useLauncherStore } from "../../stores/launcher.store"
import { useShallow } from "zustand/react/shallow"
import "./Launcher.scss"

const SYSTEM_APPS = [
  { id: "file-manager", label: "File Manager", icon: "📁" },
  { id: "terminal", label: "Terminal", icon: "💻" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "log-viewer", label: "Log Viewer", icon: "📋" },
]

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
        {SYSTEM_APPS.map((app) => (
          <button
            key={app.id}
            className="nmx-launcher__item"
            type="button"
            onMouseDown={() => handlerLauncher(app.id, app.label)}
          >
            <span className="nmx-launcher__icon">{app.icon}</span>
            <span className="nmx-launcher__label">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
