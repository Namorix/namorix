import { createSelector } from "@reduxjs/toolkit"
import type { RootState } from "../index"

export const selectorNotificationsState = (state: RootState) =>
  state.notifications

export const selectorNotifications = (state: RootState) =>
  state.notifications.items

export const selectorUnreadCount = (state: RootState) =>
  state.notifications.unreadCount

export const selectorUnreadCountCapped = createSelector(
  [selectorUnreadCount],
  (count) => (count > 99 ? "99+" : String(count)),
)

export const selectorNotificationsLoading = (state: RootState) =>
  state.notifications.loading

export const selectorNotificationsHasMore = (state: RootState) =>
  state.notifications.hasMore

export const selectorNotificationsPage = (state: RootState) =>
  state.notifications.page
