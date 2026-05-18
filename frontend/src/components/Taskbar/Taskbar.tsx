import React, { useCallback, useMemo } from "react"
import { useLauncherStore, useWindowsStore } from "../../stores"
import { useTaskbarClock } from "../../hooks"
import { TaskbarView } from "./TaskbarView"
import type { TaskbarApp } from "./Taskbar.types"
import { useShallow } from "zustand/react/shallow"

export const Taskbar: React.FC = () => {
  const windows = useWindowsStore((state) => state.windows)
  const activeId = useWindowsStore((state) => state.activeId)
  const { focusWindow, minimizeWindow } = useWindowsStore(
    useShallow((state) => ({
      focusWindow: state.focusWindow,
      minimizeWindow: state.minimizeWindow,
    })),
  )
  const toggleLauncher = useLauncherStore((state) => state.toggle)
  const time = useTaskbarClock()

  const apps = useMemo<TaskbarApp[]>(
    () =>
      windows.map((win) => ({
        id: win.id,
        icon: win.icon,
        title: win.title,
        isActive: win.id === activeId,
        isMaximized: win.maximized,
      })),
    [windows, activeId],
  )

  const handleAppClick = useCallback(
    (id: string) => {
      const win = windows.find((w) => w.id === id)

      if (win?.minimized) {
        focusWindow(id)
      } else if (id === activeId) {
        minimizeWindow(id)
      } else {
        focusWindow(id)
      }
    },
    [activeId, focusWindow, minimizeWindow, windows],
  )

  return (
    <TaskbarView
      apps={apps}
      time={time}
      onStartClick={toggleLauncher}
      onAppClick={handleAppClick}
    />
  )
}

Taskbar.displayName = "Taskbar"
