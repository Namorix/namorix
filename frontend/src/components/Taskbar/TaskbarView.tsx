import { memo } from "react"
import {
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
} from "@namorix/ui"
import { TaskbarAppButton } from "./TaskbarAppButton"
import type { WindowId } from "../../store"
import type { SignalRStatus } from "@namorix/core"

interface TaskViewProps {
  order: WindowId[]
  time: string
  date: string
  signalStatus: SignalRStatus
  onStartClick: () => void
  onAppClick: (id: WindowId) => void
}

export const TaskbarView = memo<TaskViewProps>(
  ({ order, time, date, signalStatus, onStartClick, onAppClick }) => {
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

          <div className="nmx-taskbar__tray">
            <NmxIconFont
              symbol={NmxIconFontSymbol.NOTIFICATION}
              className="nmx-taskbar__icon-notification"
            />

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
