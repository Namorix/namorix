import { memo, type RefObject } from "react"
import {
  NmxBadge,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
} from "@namorix/ui"
import { TaskbarAppButton } from "./TaskbarAppButton"
import type { WindowId } from "../../store"
import type { SignalRStatus } from "@namorix/core"
import { NotificationPanel } from "./NotificationPanel"

interface TaskViewProps {
  order: WindowId[]
  time: string
  date: string
  signalStatus: SignalRStatus
  onStartClick: () => void
  onAppClick: (id: WindowId) => void
  unreadCount: string
  isNotificationPanelOpen: boolean
  onNotificationClick: () => void
  panelRef: RefObject<HTMLDivElement | null>
}

export const TaskbarView = memo<TaskViewProps>(
  ({
    order,
    time,
    date,
    signalStatus,
    onStartClick,
    onAppClick,
    unreadCount,
    isNotificationPanelOpen,
    onNotificationClick,
    panelRef,
  }) => {
    return (
      <div className="nmx-taskbar">
        <div className="nmx-taskbar__inner">
          <button
            className="nmx-taskbar__start-btn"
            type="button"
            onMouseDown={onStartClick}
          >
            <NmxIconSvg symbol={NmxIconSvgSymbol.LOGO} />
          </button>

          <div className="nmx-taskbar__apps">
            {order.map((id) => (
              <TaskbarAppButton key={id} winId={id} onAppClick={onAppClick} />
            ))}
          </div>

          <div className="nmx-taskbar__tray" ref={panelRef}>
            <button
              className="nmx-taskbar__tray-btn"
              onClick={onNotificationClick}
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.NOTIFICATION}
                className="nmx-taskbar__tray-icon"
              />
              <NmxBadge
                size="sm"
                semantic="error"
                className="nmx-taskbar__tray-badge"
                shouldRender={unreadCount !== "0"}
              >
                {unreadCount}
              </NmxBadge>
            </button>
            {isNotificationPanelOpen && <NotificationPanel />}

            <NmxIconFont
              symbol={NmxIconFontSymbol.LINK}
              className={`nmx-taskbar__icon-signal nmx-taskbar__icon-signal--${signalStatus}`}
            />

            <div className="nmx-taskbar__clock">
              <span className="nmx-taskbar__clock__time">{time}</span>
              <span className="nmx-taskbar__clock__date">{date}</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

TaskbarView.displayName = "TaskbarView"
