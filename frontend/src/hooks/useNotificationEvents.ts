import { useEffect } from "react"
import { useSignalREvent, SignalREvent } from "@namorix/core"
import type { NmxNotificationDto } from "@namorix/core"
import {
  addNotification,
  markAsRead,
  setUnreadCount,
  useAppDispatch,
} from "../store"
import { fetchUnreadCount } from "../controllers"

export const useNotificationEvents = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    fetchUnreadCount()
      .then((count) => dispatch(setUnreadCount(count)))
      .catch(() => {})
  }, [dispatch])

  useSignalREvent<NmxNotificationDto>(
    SignalREvent.NotificationReceived,
    (data) => {
      dispatch(addNotification(data))
    },
  )
  useSignalREvent<{ id: number; isRead: boolean }>(
    SignalREvent.NotificationReadStatus,
    (data) => {
      if (data.isRead) dispatch(markAsRead(data.id))
    },
  )
}
