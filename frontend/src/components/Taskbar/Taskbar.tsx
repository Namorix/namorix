import React, { useCallback, useMemo } from "react"
import { useLauncherStore, useWindowsStore } from "../../stores"
import { useTaskbarClock } from "../../hooks"
import { TaskbarView } from "./TaskbarView"
import type { TaskbarApp } from "./Taskbar.types"
import { useShallow } from "zustand/react/shallow"

export const Taskbar: React.FC = () => {
  const windows = useWindowsStore((state) => state.windows)
  const activeId = useWindowsStore((state) => state.activeId)
  const { focusWindow, minimizeWindow, maximizeWindow, restoreWindow } =
    useWindowsStore(
      useShallow((state) => ({
        focusWindow: state.focusWindow,
        minimizeWindow: state.minimizeWindow,
        maximizeWindow: state.maximizeWindow,
        restoreWindow: state.restoreWindow,
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
      if (id === activeId) {
        minimizeWindow(id)
      } else {
        focusWindow(id)
      }
    },
    [activeId, focusWindow, minimizeWindow],
  )

  const handleAppDoubleCLick = useCallback(
    (id: string) => {
      const win = windows.find((w) => w.id === id)
      if (win?.maximized) {
        restoreWindow(id)
      } else {
        maximizeWindow(id)
      }
    },
    [windows, maximizeWindow, restoreWindow],
  )

  return (
    <TaskbarView
      apps={apps}
      time={time}
      onStartClick={toggleLauncher}
      onAppClick={handleAppClick}
      onAppDoubleClick={handleAppDoubleCLick}
    />
  )
}

Taskbar.displayName = "Taskbar"
