import type React from "react"
import { DesktopArea } from "../components/DesktopArea/DesktopArea"
import { Taskbar } from "../components/Taskbar/Taskbar"
import { WindowManager } from "../components/WindowManager/WindowManager"
import { Launcher } from "../components/Launcher/Launcher"

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
