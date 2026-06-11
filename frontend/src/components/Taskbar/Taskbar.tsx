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
  type WindowId,
} from "../../store"
import { useSignalRStatus } from "@namorix/core"
import { useOpenWindow } from "../WindowFrame"
import { useTranslation } from "react-i18next"
import type { AddonItem } from "../../types"

export const Taskbar: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const openWindow = useOpenWindow()
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

  const handleViewAllNotifications = useCallback(() => {
    setNotificationPanelOpen(false)

    openWindow({
      id: "notification-center" as WindowId,
      displayName: t("addon.notificationCenter.title"),
      localeKey: "notificationCenter",
      defaultWidth: 480,
      defaultHeight: 560,
    } as AddonItem)
  }, [openWindow, t])

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
      onViewAllNotifications={handleViewAllNotifications}
      panelRef={panelRef}
    />
  )
}

Taskbar.displayName = "Taskbar"
