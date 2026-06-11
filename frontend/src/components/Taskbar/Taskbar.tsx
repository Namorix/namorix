import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTaskbarClock } from "../../hooks"
import { TaskbarView } from "./TaskbarView"
import {
  closeLauncher,
  focusWindow,
  minimizeWindow,
  selectorActiveId,
  selectorTaskbarOrder,
  selectorUnreadCountCapped,
  store,
  toggleLauncher,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import { useSignalRStatus } from "@namorix/core"

export const Taskbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const order = useAppSelector(selectorTaskbarOrder)
  const activeId = useAppSelector(selectorActiveId)
  const signalStatus = useSignalRStatus()
  const unreadCountCapped = useAppSelector(selectorUnreadCountCapped)
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { time, date } = useTaskbarClock()

  const handleAppClick = useCallback(
    (id: string) => {
      const state = store.getState()
      const win = state.windowsState.byId[id]

      if (win?.minimized) {
        dispatch(focusWindow(id))
      } else if (id === activeId) {
        dispatch(minimizeWindow(id))
      } else {
        dispatch(focusWindow(id))
      }
    },
    [activeId, dispatch],
  )

  useEffect(() => {
    if (!isNotificationPanelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationPanelOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isNotificationPanelOpen])

  return (
    <TaskbarView
      order={order}
      time={time}
      date={date}
      signalStatus={signalStatus}
      unreadCount={unreadCountCapped}
      isNotificationPanelOpen={isNotificationPanelOpen}
      onStartClick={() => {
        setNotificationPanelOpen(false)
        dispatch(toggleLauncher())
      }}
      onAppClick={handleAppClick}
      onNotificationClick={() => {
        dispatch(closeLauncher())
        setNotificationPanelOpen((v) => !v)
      }}
      panelRef={panelRef}
    />
  )
}

Taskbar.displayName = "Taskbar"
