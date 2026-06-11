import React, { useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { NmxAddonRoot } from "@namorix/ui"
import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconBox,
  NmxIconSvg,
  NmxIconSvgSymbol,
} from "@namorix/ui"
import {
  useAppDispatch,
  useAppSelector,
  selectorNotifications,
  selectorNotificationsLoading,
  selectorNotificationsHasMore,
  selectorNotificationsPage,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  setNotifications,
  setLoading,
} from "../../store"
import { fetchNotifications } from "../../controllers"
import {
  resolveNotificationTitle,
  resolveNotificationDescription,
} from "../../utils/notification"
import type { NmxNotificationDto } from "@namorix/core"

const TYPE_ICON: Record<string, NmxIconFontSymbol> = {
  info: NmxIconFontSymbol.INFO,
  success: NmxIconFontSymbol.CHECK,
  warning: NmxIconFontSymbol.WARNING,
  error: NmxIconFontSymbol.CLOSE,
}

const NotificationRow: React.FC<{ notif: NmxNotificationDto }> = ({
  notif,
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  return (
    <div
      className={`nmx-notification-row ${!notif.isRead ? "nmx-notification-row--unread" : ""}`}
      onClick={() => {
        if (!notif.isRead) dispatch(markAsRead(notif.id))
      }}
    >
      <NmxIconBox semantic={notif.type}>
        <NmxIconFont symbol={TYPE_ICON[notif.type] ?? NmxIconFontSymbol.INFO} />
      </NmxIconBox>
      <div className="nmx-notification-row__body">
        <span className="nmx-notification-row__title">
          {resolveNotificationTitle(t, notif)}
        </span>
        {resolveNotificationDescription(t, notif) && (
          <span className="nmx-notification-row__desc">
            {resolveNotificationDescription(t, notif)}
          </span>
        )}
      </div>
      <button
        className="nmx-notification-row__dismiss"
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          dispatch(dismissNotification(notif.id))
        }}
        title={t("addon.notificationCenter.action.dismiss")}
      >
        <NmxIconFont symbol={NmxIconFontSymbol.CLOSE} />
      </button>
    </div>
  )
}

export const NotificationCenter: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectorNotifications)
  const loading = useAppSelector(selectorNotificationsLoading)
  const hasMore = useAppSelector(selectorNotificationsHasMore)
  const page = useAppSelector(selectorNotificationsPage)
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  const loadPage = useCallback(
    async (p: number) => {
      dispatch(setLoading(true))
      try {
        const data = await fetchNotifications(p, 20)
        dispatch(setNotifications({ ...data, append: p > 1 }))
      } catch {
        dispatch(setLoading(false))
      }
    },
    [dispatch],
  )

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  const filtered = filter === "unread" ? items.filter((n) => !n.isRead) : items

  return (
    <NmxAddonRoot className="nmx-addon-notification-center">
      <div className="nmx-notification-center__header">
        <h2>{t("addon.notificationCenter.title")}</h2>
        <div className="nmx-notification-center__actions">
          <button type="button" onClick={() => dispatch(markAllAsRead())}>
            {t("addon.notificationCenter.action.markAllRead")}
          </button>
        </div>
      </div>

      <div className="nmx-notification-center__filters">
        <button
          className={filter === "all" ? "active" : ""}
          type="button"
          onClick={() => setFilter("all")}
        >
          {t("addon.notificationCenter.filter.all")}
        </button>
        <button
          className={filter === "unread" ? "active" : ""}
          type="button"
          onClick={() => setFilter("unread")}
        >
          {t("addon.notificationCenter.filter.unread")}
        </button>
      </div>

      <div className="nmx-notification-center__list">
        {filtered.length === 0 ? (
          <div className="nmx-notification-center__empty">
            <NmxIconSvg symbol={NmxIconSvgSymbol.APP_NOTIFICATION_CENTER} />
            <span>{t("addon.notificationCenter.empty")}</span>
            <span className="nmx-notification-center__empty-desc">
              {t("addon.notificationCenter.emptyDescription")}
            </span>
          </div>
        ) : (
          filtered.map((notif) => (
            <NotificationRow key={notif.id} notif={notif} />
          ))
        )}
      </div>

      {hasMore && (
        <div className="nmx-notification-center__load-more">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadPage(page + 1)}
          >
            {loading
              ? "Loading..."
              : t("addon.notificationCenter.action.loadMore")}
          </button>
        </div>
      )}
    </NmxAddonRoot>
  )
}
