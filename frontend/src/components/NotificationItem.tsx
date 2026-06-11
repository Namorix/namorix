import { memo } from "react"
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
} from "@namorix/ui"
import {
  NOTIFICATION_SOURCE_ICON,
  NOTIFICATION_TYPE_ICON,
  resolveNotificationDescriptionHtml,
  resolveSourceName,
} from "../utils/notification"

interface NotificationItemProps {
  notification: NmxNotificationDto
  onRead?: (id: number) => void
}

export const NotificationItem = memo<NotificationItemProps>(
  ({ notification, onRead }) => {
    const { t } = useTranslation()
    const { relativeTime } = useDateTimeFormat()

    return (
      <button
        className={cx("nmx-notification-item", {
          "nmx-notification-item--unread": !notification.isRead,
        })}
        type="button"
        onClick={() => onRead?.(notification.id)}
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
          <div>
            <span className="nmx-notification-item__title">
              {resolveSourceName(t, notification.source)}
            </span>
          </div>
          <span
            className="nmx-notification-item__description"
            dangerouslySetInnerHTML={{
              __html: resolveNotificationDescriptionHtml(t, notification),
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

NotificationItem.displayName = "NotificationItem"
