import React, { useEffect } from "react"
import { DesktopArea, Launcher, Taskbar, WindowManager } from "../components"
import { defocusAll, useAppDispatch } from "../store"
import { useSignalR } from "@namorix/core"
import { useNotificationEvents } from "../hooks"

export const Desktop: React.FC = () => {
  const dispatch = useAppDispatch()

  useSignalR(true)
  useNotificationEvents()
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

    const preventContextMenu = (e: MouseEvent) => e.preventDefault()

    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("contextmenu", preventContextMenu)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("contextmenu", preventContextMenu)
    }
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
