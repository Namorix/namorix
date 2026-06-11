import React, { memo } from "react"
import { useTranslation } from "react-i18next"
import { type NmxNotificationDto, useDateTimeFormat } from "@namorix/core"
import {
  cx,
  NmxIconBox,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
  type NmxSemanticColor,
  type WithBaseProps,
} from "@namorix/ui"
import {
  NOTIFICATION_SOURCE_ICON,
  NOTIFICATION_TYPE_ICON,
  resolveNotificationDescriptionHtml,
  resolveSourceName,
} from "../utils/notification"
import { useDoubleTap } from "@namorix/core/hooks/useDoubleTap"

interface NotificationItemProps extends WithBaseProps {
  notification: NmxNotificationDto
  onRead?: (id: number) => void
  onDetail?: (id: number) => void
  isSkeleton?: boolean
}

export const NotificationItem = memo<NotificationItemProps>(
  ({ notification, onRead, onDetail, className, isSkeleton }) => {
    const { t } = useTranslation()
    const { relativeTime } = useDateTimeFormat()

    const handleDoubleClick = useDoubleTap((e: React.MouseEvent) => {
      e.stopPropagation()
      onDetail?.(notification.id)
    })

    return (
      <button
        className={cx("nmx-notification-item", className, {
          "nmx-notification-item--unread": !notification.isRead,
        })}
        type="button"
        onClick={(e) => {
          handleDoubleClick(e)
          onRead?.(notification.id)
        }}
      >
        <div className="nmx-notification-item__icon-box">
          <NmxIconSvg
            symbol={
              NOTIFICATION_SOURCE_ICON[notification.source ?? ""] ??
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
              )[notification.type] ?? (notification.type as NmxSemanticColor)
            }
            className="nmx-notification-item__box-level"
          >
            <NmxIconFont
              symbol={
                NOTIFICATION_TYPE_ICON[notification.type ?? "info"] ??
                NmxIconFontSymbol.INFO
              }
              className="nmx-notification-item__icon-level"
            />
          </NmxIconBox>
        </div>
        <div className="nmx-notification-item__body">
          <span className="nmx-notification-item__title">
            {isSkeleton
              ? notification.source
              : resolveSourceName(t, notification.source)}
          </span>
          <span
            className="nmx-notification-item__description"
            dangerouslySetInnerHTML={{
              __html: isSkeleton
                ? notification.key
                : resolveNotificationDescriptionHtml(t, notification),
            }}
          />
          <div className="nmx-notification-item__time">
            {notification.occurrences > 1 && (
              <span className="nmx-notification-item__occurred-times">
                {t("notification.occurredTimes", {
                  count: notification.occurrences,
                })}
              </span>
            )}
            <span>
              {notification.createdAt
                ? relativeTime(notification.createdAt)
                : ""}
            </span>
          </div>
        </div>
      </button>
    )
  },
)

export const NotificationItemSkeleton: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NotificationItem
      className="nmx-notification-item--skeleton"
      notification={{
        id: 999,
        type: "info",
        key: t("notification.skeleton.description"),
        source: t("notification.skeleton.source"),
        isRead: true,
        occurrences: 0,
        createdAt: new Date().toISOString(),
        lastOccurredAt: new Date().toISOString(),
      }}
      isSkeleton={true}
    />
  )
}

NotificationItem.displayName = "NotificationItem"
