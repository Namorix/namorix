import { memo } from "react"
import { NmxIconSvg, NmxIconSvgSymbol } from "@namorix/ui"
import type { TaskbarApp } from "./Taskbar.types"
import { TaskbarAppButton } from "./TaskbarAppButton"

interface TaskViewProps {
  apps: TaskbarApp[]
  time: string
  onStartClick: () => void
  onAppClick: (id: string) => void
}

export const TaskbarView = memo<TaskViewProps>(
  ({ apps, time, onStartClick, onAppClick }) => {
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
            {apps.map((app) => (
              <TaskbarAppButton
                key={app.id}
                app={app}
                onAppClick={onAppClick}
              />
            ))}
          </div>

          <div className="nmx-taskbar__tray">
            <span className="nmx-taskbar__clock">{time}</span>
          </div>
        </div>
      </div>
    )
  },
)

TaskbarView.displayName = "TaskbarView"
