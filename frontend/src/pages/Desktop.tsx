import type React from "react"
import { DesktopArea, Launcher, Taskbar, WindowManager } from "../components"

export const Desktop: React.FC = () => {
  return (
    <>
      <DesktopArea />
      <WindowManager />
      <Launcher />
      <Taskbar />
    </>
  )
}
