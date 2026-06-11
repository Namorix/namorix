import { memo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconBox,
  type NmxSemanticColor,
} from "@namorix/ui"
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
import {
  resolveNotificationDescriptionHtml,
  resolveNotificationTitleHtml,
} from "../../utils/notification"
import { type NmxNotificationDto, useDateTimeFormat } from "@namorix/core"

interface NotificationPanelProps {
  onViewAll: () => void
}

const TYPE_ICON: Record<string, NmxIconFontSymbol> = {
  info: NmxIconFontSymbol.INFO,
  success: NmxIconFontSymbol.CHECK,
  warning: NmxIconFontSymbol.WARNING,
  error: NmxIconFontSymbol.CLOSE,
  security: NmxIconFontSymbol.SECURITY,
}

const NotificationItem = memo<{ notification: NmxNotificationDto }>(
  ({ notification }) => {
    const { t } = useTranslation()
    const { relativeTime } = useDateTimeFormat()
    const dispatch = useAppDispatch()

    return (
      <button
        className={`nmx-notification-item ${!notification.isRead ? "nmx-notification-item--unread" : ""}`}
        type="button"
        onClick={() => dispatch(markAsRead(notification.id))}
      >
        <NmxIconBox
          semantic={
            (
              { security: "error" } as Partial<Record<string, NmxSemanticColor>>
            )[notification.type] ?? (notification.type as NmxSemanticColor)
          }
          className="nmx-notification-item__icon-box"
        >
          <NmxIconFont
            symbol={TYPE_ICON[notification.type] ?? NmxIconFontSymbol.INFO}
            className="nmx-notification-item__icon"
          />
        </NmxIconBox>
        <div className="nmx-notification-item__body">
          <span
            className="nmx-notification-item__title"
            dangerouslySetInnerHTML={{
              __html: resolveNotificationTitleHtml(t, notification),
            }}
          />
          <span
            className="nmx-notification-item__description"
            dangerouslySetInnerHTML={{
              __html: resolveNotificationDescriptionHtml(t, notification),
            }}
          />
          <span className="nmx-notification-item__time">
            {notification.createdAt ? relativeTime(notification.createdAt) : ""}
          </span>
        </div>
      </button>
    )
  },
)

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
                <NmxIconFont
                  symbol={NmxIconFontSymbol.MARK_ALL}
                  className="nmx-notification-panel__actions-icon"
                />
              </button>
            )}
            <button
              className="nmx-notification-panel__actions-btn"
              type="button"
              onClick={onViewAll}
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.NOTIFICATION}
                className="nmx-notification-panel__actions-icon"
              />
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
              .map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
          )}
        </div>
      </div>
    )
  },
)
NotificationPanel.displayName = "NotificationPanel"
