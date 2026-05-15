import React, { useEffect, useState } from "react"
import { cx } from "@namorix/core"
import { useWindowsStore } from "../../stores/window.store"
import "./Taskbar.scss"
import { useLauncherStore } from "../../stores/launcher.store"

export const Taskbar: React.FC = () => {
  const {
    windows,
    activeId,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
  } = useWindowsStore()
  const toggleLauncher = useLauncherStore((state) => state.toggle)
  const [time, setTime] = useState(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      )
    }, 30_000)

    return () => clearInterval(id)
  }, [])

  return (
    <div className="nmx-taskbar">
      <div className="nmx-taskbar__start">
        <button
          className="nmx-taskbar__start-btn"
          type="button"
          onMouseDown={toggleLauncher}
        >
          Start
        </button>
      </div>

      <div className="nmx-taskbar__apps">
        {windows.map((win) => (
          <button
            key={win.id}
            className={cx("nmx-taskbar__app-btn", {
              "nmx-taskbar__app-btn--active": win.id === activeId,
            })}
            type="button"
            onMouseDown={() => {
              if (win.id === activeId) {
                minimizeWindow(win.id)
              } else {
                focusWindow(win.id)
              }
            }}
            onDoubleClick={() => {
              if (win.maximized) {
                restoreWindow(win.id)
              } else {
                maximizeWindow(win.id)
              }
            }}
          >
            {win.title}
          </button>
        ))}
      </div>

      <div className="nmx-taskbar__tray">
        <span className="nmx-taskbar__clock">{time}</span>
      </div>
    </div>
  )
}
