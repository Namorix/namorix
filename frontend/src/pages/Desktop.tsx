import React, { useEffect } from "react"
import { DesktopArea, Launcher, Taskbar, WindowManager } from "../components"
import { defocusAll, useAppDispatch } from "../store"
import { type ExternalAddonManifest, useSignalR } from "@namorix/core"
import { useAddonEvents, useNotificationEvents } from "../hooks"
import { registerAddon } from "../addons"
import { createExternalAddonEntry } from "../services/externalAddonEntry"

registerAddon({
  manifest: { id: "thread", displayName: "Thread", icon: "app-terminal" },
  entry: createExternalAddonEntry({
    id: "thread",
    hostPort: 5180,
  } as ExternalAddonManifest),
})

export const Desktop: React.FC = () => {
  const dispatch = useAppDispatch()

  useSignalR(true)
  useNotificationEvents()
  useAddonEvents()
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
