import React, { useEffect } from "react"
import { DesktopArea, Launcher, Taskbar, WindowManager } from "../components"
import { useWindowsStore } from "../stores"

export const Desktop: React.FC = () => {
  const defocusAll = useWindowsStore((state) => state.defocusAll)

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".nmx-window-frame")) {
        defocusAll()
      }
    }

    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [defocusAll])

  return (
    <>
      <DesktopArea />
      <WindowManager />
      <Launcher />
      <Taskbar />
    </>
  )
}
