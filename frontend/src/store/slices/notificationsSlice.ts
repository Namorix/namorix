import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { NmxNotificationDto } from "@namorix/core"

export interface NotificationsState {
  items: NmxNotificationDto[]
  unreadCount: number
  loading: boolean
  page: number
  totalCount: number
  hasMore: boolean
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  page: 1,
  totalCount: 0,
  hasMore: false,
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
        hasMore: boolean
        append?: boolean
      }>,
    ) {
      const { items, page, totalCount, hasMore, append } = action.payload
      state.items = append ? [...state.items, ...items] : items
      state.page = page
      state.totalCount = totalCount
      state.hasMore = hasMore
      state.loading = false
    },

    addNotification(state, action: PayloadAction<NmxNotificationDto>) {
      state.items.unshift(action.payload)
      state.totalCount += 1
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
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

    dismissNotification(state, action: PayloadAction<number>) {
      const idx = state.items.findIndex((n) => n.id === action.payload)
      if (idx !== -1) {
        const removed = state.items[idx]
        if (removed && !removed.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.items.splice(idx, 1)
      }
    },

    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },

    setPageInfo(
      state,
      action: PayloadAction<{
        page: number
        totalCount: number
        hasMore: boolean
      }>,
    ) {
      state.page = action.payload.page
      state.totalCount = action.payload.totalCount
      state.hasMore = action.payload.hasMore
    },
  },
})

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  setUnreadCount,
  setLoading,
  setPageInfo,
} = notificationsSlice.actions

export const notificationsReducer = notificationsSlice.reducer
