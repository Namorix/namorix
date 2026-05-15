import React from "react"
import "./DesktopArea.scss"
import { useWindowsStore } from "../../stores/window.store"

const DESKTOP_APPS = [
  { id: "file-manager", label: "File Manager", icon: "📁" },
  { id: "terminal", label: "Terminal", icon: "💻" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "log-viewer", label: "Log Viewer", icon: "📋" },
]

export const DesktopArea: React.FC = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  return (
    <div className="nmx-desktop-area">
      <div className="nmx-desktop-area__grid">
        {DESKTOP_APPS.map((app) => (
          <button
            key={app.id}
            className="nmx-desktop-area__icon"
            type="button"
            onDoubleClick={() => openWindow(app.id, app.label)}
          >
            <span className="nmx-desktop-area__icon-img">{app.icon}</span>
            <span className="nmx-desktop-area__icon-label">{app.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
