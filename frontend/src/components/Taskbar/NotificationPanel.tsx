import { memo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { NmxBadge, NmxIconFont, NmxIconFontSymbol } from "@namorix/ui"
import {
  useAppSelector,
  useAppDispatch,
  selectorNotifications,
  selectorUnreadCount,
  markAsRead,
  markAllAsRead,
  setNotifications,
  setLoading,
  selectorNotificationsLoading,
} from "../../store"
import {
  fetchNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from "../../controllers"
import { nmxToast } from "@namorix/core"
import { NotificationItem } from "../NotificationItem"

export const NotificationPanel = memo(() => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectorNotifications)
  const unreadCount = useAppSelector(selectorUnreadCount)
  const loading = useAppSelector(selectorNotificationsLoading)

  useEffect(() => {
    dispatch(setLoading(true))
    fetchNotifications(1, 5)
      .then((data) => {
        dispatch(setNotifications({ ...data, append: false }))
      })
      .catch(() => dispatch(setLoading(false)))
  }, [dispatch])

  return (
    <div className="nmx-notification-panel">
      <div className="nmx-notification-panel__header">
        <div className="nmx-notification-panel__title-wrap">
          <span className="nmx-notification-panel__title">
            {t("notification.title")}
          </span>
          {unreadCount > 0 && (
            <NmxBadge
              semantic="error"
              size="sm"
              className="nmx-notification-panel__title-badge"
            >
              {unreadCount}
            </NmxBadge>
          )}
        </div>
        <div className="nmx-notification-panel__actions">
          {unreadCount > 0 && (
            <button
              className="nmx-notification-panel__actions-btn"
              type="button"
              onClick={() => {
                apiMarkAllAsRead()
                  .then(() => dispatch(markAllAsRead()))
                  .catch((err) => nmxToast.error(err))
              }}
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.MARK_ALL}
                className="nmx-notification-panel__actions-icon"
              />
            </button>
          )}
        </div>
      </div>

      <div className="nmx-notification-panel__list">
        {loading ? (
          <div className="nmx-notification-panel__loading">
            <span>{t("notification.loadNotifications")}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="nmx-notification-panel__empty">
            <span>{t("notification.noNotifications")}</span>
          </div>
        ) : (
          items.slice(0, 5).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => {
                apiMarkAsRead(notification.id)
                  .then(() => dispatch(markAsRead(notification.id)))
                  .catch((err) => nmxToast.error(err))
              }}
            />
          ))
        )}
      </div>
    </div>
  )
})
NotificationPanel.displayName = "NotificationPanel"
