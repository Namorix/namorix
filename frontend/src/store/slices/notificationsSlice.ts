import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { NmxNotificationDto } from "@namorix/core"

export interface NotificationsState {
  items: NmxNotificationDto[]
  unreadCount: number
  loading: boolean
  page: number
  totalCount: number
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  page: 1,
  totalCount: 0,
}

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,

  reducers: {
    setNotifications(
      state,
      action: PayloadAction<{
        items: NmxNotificationDto[]
        page: number
        totalCount: number
        append?: boolean
      }>,
    ) {
      const { items, page, totalCount, append } = action.payload
      state.items = append ? [...state.items, ...items] : items
      state.page = page
      state.totalCount = totalCount
      state.loading = false
    },

    addNotification(state, action: PayloadAction<NmxNotificationDto>) {
      const existing = state.items.find((n) => n.id === action.payload.id)
      if (existing) {
        Object.assign(existing, action.payload)
        return
      }
      state.items.unshift(action.payload)
      state.totalCount += 1
      if (!action.payload.isRead) state.unreadCount += 1
    },

    markAsRead(state, action: PayloadAction<number>) {
      const notif = state.items.find((n) => n.id === action.payload)
      if (notif && !notif.isRead) {
        notif.isRead = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },

    markAllAsRead(state) {
      for (const notif of state.items) notif.isRead = true
      state.unreadCount = 0
    },

    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },

    clearRead(state) {
      state.items = state.items.filter((n) => !n.isRead)
      state.totalCount = state.items.length
    },
  },
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setUnreadCount,
  setLoading,
  clearRead,
} = notificationsSlice.actions

export const notificationsReducer = notificationsSlice.reducer
