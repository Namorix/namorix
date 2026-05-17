import React from "react"
import { useLauncherStore, useWindowsStore } from "../../stores"
import { useTaskbarClock } from "../../hooks"
import { TaskbarView } from "./TaskbarView"
import type { TaskbarApp } from "./Taskbar.types"

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
  const time = useTaskbarClock()

  const apps: TaskbarApp[] = windows.map((win) => ({
    id: win.id,
    icon: win.icon,
    title: win.title,
    isActive: win.id === activeId,
    isMaximized: win.maximized,
  }))

  return (
    <TaskbarView
      apps={apps}
      time={time}
      onStartClick={toggleLauncher}
      onAppClick={(id) => {
        if (id === activeId) {
          minimizeWindow(id)
        } else {
          focusWindow(id)
        }
      }}
      onAppDoubleClick={(id) => {
        const win = windows.find((w) => w.id === id)
        if (win?.maximized) {
          restoreWindow(id)
        } else {
          maximizeWindow(id)
        }
      }}
    />
  )
}
