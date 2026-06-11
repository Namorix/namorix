import { useCallback } from "react"
import { useSignalREvent, SignalREvent } from "@namorix/core"
import type { NmxNotificationDto } from "@namorix/core"
import { addNotification, markAsRead, useAppDispatch } from "../store"

export const useNotificationEvents = () => {
  const dispatch = useAppDispatch()
  useSignalREvent<NmxNotificationDto>(
    SignalREvent.NotificationReceived,
    useCallback(
      (data) => {
        dispatch(addNotification(data))
      },
      [dispatch],
    ),
  )

  useSignalREvent<{ id: number; isRead: boolean }>(
    SignalREvent.NotificationReadStatus,
    useCallback(
      (data) => {
        if (data.isRead) dispatch(markAsRead(data.id))
      },
      [dispatch],
    ),
  )
}
