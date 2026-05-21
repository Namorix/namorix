import React, { useEffect } from "react"
import { DesktopArea, Launcher, Taskbar, WindowManager } from "../components"
import { defocusAll, useAppDispatch } from "../store"
import { useSignalR } from "@namorix/core"

export const Desktop: React.FC = () => {
  const dispatch = useAppDispatch()

  useSignalR(true)
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      if (
        !target.closest(".nmx-window-frame") &&
        !target.closest(".nmx-taskbar__app-btn")
      ) {
        dispatch(defocusAll())
      }
    }

    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [dispatch])

  return (
    <>
      <DesktopArea />
      <WindowManager />
      <Launcher />
      <Taskbar />
    </>
  )
}
