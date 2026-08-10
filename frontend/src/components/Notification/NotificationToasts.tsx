import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  SignalREvent,
  type NmxNotificationDto,
  useAppearanceStore,
} from "@namorix/core"
import { cx } from "@namorix/ui"
import { NotificationItem } from "./NotificationItem"
import { useSignalREvent } from "../../signalr"

const MAX_TOASTS = 2
const TOAST_DURATION_MS = 5000
const EXIT_ANIM_MS = 500

interface ToastItem {
  id: number
  notification: NmxNotificationDto
  phase: "enter" | "exit"
}

let nextToastId = 1

export const NotificationToasts: React.FC = () => {
  const appearance = useAppearanceStore()
  const toastEnabled = appearance?.appearance_notifications_toast !== "false"
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, phase: "exit" } : t)),
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_ANIM_MS)
  }, [])

  useSignalREvent<NmxNotificationDto>(
    SignalREvent.NotificationReceived,
    useCallback(
      (notification: NmxNotificationDto) => {
        const id = nextToastId++
        setToasts((prev) => {
          const item: ToastItem = { id, notification, phase: "enter" }
          return [item, ...prev].slice(0, MAX_TOASTS)
        })
        const timer = setTimeout(() => {
          dismiss(id)
          timersRef.current.delete(id)
        }, TOAST_DURATION_MS)
        timersRef.current.set(id, timer)
      },
      [dismiss],
    ),
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
    }
  }, [])

  if (!toastEnabled) return

  return createPortal(
    <div className="nmx-notification-toast-provider">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cx(
            "nmx-notification-toast",
            `nmx-notification-toast--${item.phase}`,
          )}
        >
          <NotificationItem
            notification={item.notification}
            onRead={() => dismiss(item.id)}
            iconDisabled={false}
            timeDisabled={true}
          />
        </div>
      ))}
    </div>,
    document.body,
  )
}
