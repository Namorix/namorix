import { memo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { NmxIconFont, NmxIconFontSymbol, NmxIconBox } from "@namorix/ui"
import {
  useAppSelector,
  useAppDispatch,
  selectorNotifications,
  selectorUnreadCount,
  markAsRead,
  markAllAsRead,
  setNotifications,
  setLoading,
} from "../../store"
import { fetchNotifications } from "../../controllers"
import { resolveNotifTitle } from "../../utils/notification"
import type { NmxNotificationDto } from "@namorix/core"

interface NotificationPanelProps {
  onViewAll: () => void
}

const TYPE_ICON: Record<string, NmxIconFontSymbol> = {
  info: NmxIconFontSymbol.INFO,
  success: NmxIconFontSymbol.CHECK,
  warning: NmxIconFontSymbol.WARNING,
  error: NmxIconFontSymbol.CLOSE,
}

const NotificationItem = memo<{ notif: NmxNotificationDto }>(({ notif }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  return (
    <button
      className={`nmx-notification-item ${!notif.isRead ? "nmx-notification-item--unread" : ""}`}
      type="button"
      onClick={() => dispatch(markAsRead(notif.id))}
    >
      {!notif.isRead && <span className="nmx-notification-item__dot" />}
      <NmxIconBox semantic={notif.type}>
        <NmxIconFont symbol={TYPE_ICON[notif.type] ?? NmxIconFontSymbol.INFO} />
      </NmxIconBox>
      <div className="nmx-notification-item__body">
        <span className="nmx-notification-item__title">
          {resolveNotifTitle(t, notif)}
        </span>
      </div>
    </button>
  )
})

NotificationItem.displayName = "NotificationItem"

export const NotificationPanel = memo<NotificationPanelProps>(
  ({ onViewAll }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const items = useAppSelector(selectorNotifications)
    const unreadCount = useAppSelector(selectorUnreadCount)

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
          <span className="nmx-notification-panel__title">
            {t("addon.notificationCenter.panel.title")}
          </span>
          <div className="nmx-notification-panel__actions">
            {unreadCount > 0 && (
              <button
                className="nmx-notification-panel__actions-btn"
                type="button"
                onClick={() => dispatch(markAllAsRead())}
              >
                <NmxIconFont symbol={NmxIconFontSymbol.MARK_ALL} />
              </button>
            )}
            <button
              className="nmx-notification-panel__actions-btn"
              type="button"
              onClick={onViewAll}
            >
              <NmxIconFont symbol={NmxIconFontSymbol.NOTIFICATION} />
            </button>
          </div>
        </div>

        <div className="nmx-notification-panel__list">
          {items.length === 0 ? (
            <div className="nmx-notification-panel__empty">
              <span>{t("addon.notificationCenter.panel.noNotifications")}</span>
            </div>
          ) : (
            items
              .slice(0, 5)
              .map((notif) => <NotificationItem key={notif.id} notif={notif} />)
          )}
        </div>
      </div>
    )
  },
)
NotificationPanel.displayName = "NotificationPanel"
