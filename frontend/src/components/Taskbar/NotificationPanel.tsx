import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import {
  cx,
  NmxAlertDialog,
  NmxBadge,
  NmxIconBox,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
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
  selectorNotificationsLoading,
  selectorNotificationsPage,
  selectorNotificationsTotalCount,
  clearRead,
} from "../../store"
import {
  fetchNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteRead,
} from "../../controllers"
import { type NmxNotificationDto, nmxToast } from "@namorix/core"
import { NotificationItem, NotificationItemSkeleton } from "../NotificationItem"
import {
  NOTIFICATION_SOURCE_ICON,
  NOTIFICATION_TYPE_ICON,
  resolveNotificationDescriptionHtml,
  resolveSourceName,
} from "../../utils/notification"

const PAGE_SIZE = 10

export const NotificationPanel = memo(() => {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectorNotifications)
  const unreadCount = useAppSelector(selectorUnreadCount)
  const page = useAppSelector(selectorNotificationsPage)
  const loading = useAppSelector(selectorNotificationsLoading)
  const totalCount = useAppSelector(selectorNotificationsTotalCount)
  const [filter, setFilter] = useState(false)
  const [detail, setDetail] = useState<NmxNotificationDto | null>(null)

  const filteredItems = useMemo(
    () => (filter ? items.filter((n) => !n.isRead) : items),
    [items, filter],
  )

  const readCount = useMemo(() => items.filter((n) => n.isRead).length, [items])

  useEffect(() => {
    if (items.length > 0) return

    dispatch(setLoading(true))
    fetchNotifications(1, PAGE_SIZE)
      .then((data) => {
        dispatch(setNotifications({ ...data, append: false }))
      })
      .catch((err) => {
        dispatch(setLoading(false))
        nmxToast.error(err)
      })
  }, [dispatch, items.length])

  const handleScroll = useCallback(() => {
    const el = listRef.current
    const hasMore = items.length < totalCount

    if (!el || loading || !hasMore) return

    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      dispatch(setLoading(true))

      fetchNotifications(page + 1, PAGE_SIZE)
        .then((data) => dispatch(setNotifications({ ...data, append: true })))
        .catch((err) => {
          dispatch(setLoading(false))
          nmxToast.error(err)
        })
    }
  }, [items.length, totalCount, loading, dispatch, page])

  const handleToggleFilter = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setFilter((f) => !f)
  }, [])

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (readCount <= 0) return

      deleteRead()
        .then(() => {
          dispatch(clearRead())
          nmxToast.success(
            t("notification.deleteAllReadSuccess", { count: readCount }),
          )
        })
        .catch((err) => nmxToast.error(err))
    },
    [dispatch, readCount, t],
  )

  return (
    <div className="nmx-notification-panel" ref={panelRef}>
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
            <>
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
              <button
                className={cx(
                  "nmx-notification-panel__actions-btn",
                  "nmx-notification-panel__btn-filter",
                  {
                    "nmx-notification-panel__btn-filter--active": filter,
                  },
                )}
                type="button"
                onClick={handleToggleFilter}
              >
                <NmxIconFont
                  symbol={NmxIconFontSymbol.FILTER}
                  className="nmx-notification-panel__actions-icon"
                />
              </button>
            </>
          )}
          {readCount > 0 && (
            <>
              <button
                className={cx(
                  "nmx-notification-panel__actions-btn",
                  "nmx-notification-panel__btn-delete",
                )}
                type="button"
                onClick={handleDeleteClick}
              >
                <NmxIconFont
                  symbol={NmxIconFontSymbol.DELETE}
                  className="nmx-notification-panel__actions-icon"
                />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="nmx-notification-panel__list"
        ref={listRef}
        onScroll={handleScroll}
      >
        {loading && items.length === 0 ? (
          <div className="nmx-notification-panel__loading">
            <span>{t("notification.loadNotifications")}</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="nmx-notification-panel__empty">
            <span>{t("notification.noNotifications")}</span>
          </div>
        ) : (
          <>
            {filteredItems.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => {
                  apiMarkAsRead(notification.id)
                    .then(() => dispatch(markAsRead(notification.id)))
                    .catch((err) => nmxToast.error(err))
                }}
                onDetail={() => setDetail(notification)}
              />
            ))}

            {loading && items.length > 0 && <NotificationItemSkeleton />}
          </>
        )}
      </div>

      <div className="nmx-notification-panel__footer">
        <span className="nmx-notification-panel__showing-count">
          {t("notification.showingCount", {
            loaded: items.length,
            total: totalCount,
          })}
        </span>
      </div>

      <NmxAlertDialog
        open={!!detail}
        title={
          detail
            ? resolveSourceName(t, detail.source) + " · " + t(detail.type)
            : ""
        }
        onClose={() => setDetail(null)}
        size="md"
      >
        {detail && (
          <div className="nmx-notification-dialog">
            <div className="nmx-notification-item__icon-box">
              <NmxIconSvg
                symbol={
                  NOTIFICATION_SOURCE_ICON[detail.source ?? ""] ??
                  NmxIconSvgSymbol.APP_SYSTEM
                }
                className="nmx-notification-item__icon"
              />
              <NmxIconBox
                semantic={
                  (
                    { security: "error" } as Partial<
                      Record<string, NmxSemanticColor>
                    >
                  )[detail.type] ?? (detail.type as NmxSemanticColor)
                }
                className="nmx-notification-item__box-level"
              >
                <NmxIconFont
                  symbol={
                    NOTIFICATION_TYPE_ICON[detail.type ?? "info"] ??
                    NmxIconFontSymbol.INFO
                  }
                  className="nmx-notification-item__icon-level"
                />
              </NmxIconBox>
            </div>
            <span
              dangerouslySetInnerHTML={{
                __html: detail
                  ? resolveNotificationDescriptionHtml(t, detail)
                  : "",
              }}
            />
          </div>
        )}
      </NmxAlertDialog>
    </div>
  )
})
NotificationPanel.displayName = "NotificationPanel"
