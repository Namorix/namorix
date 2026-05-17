import React from "react"
import { NmxIconSvg, NmxIconSvgSymbol } from "@namorix/ui"
import type { TaskbarApp } from "./Taskbar.types"
import { TaskbarAppButton } from "./TaskbarAppButton"

interface TaskViewProps {
  apps: TaskbarApp[]
  time: string
  onStartClick: () => void
  onAppClick: (id: string) => void
  onAppDoubleClick: (id: string) => void
}

export const TaskbarView: React.FC<TaskViewProps> = ({
  apps,
  time,
  onStartClick,
  onAppClick,
  onAppDoubleClick,
}) => {
  return (
    <div className="nmx-taskbar">
      <div className="nmx-taskbar__inner">
        <div className="nmx-taskbar__start">
          <button
            className="nmx-taskbar__start-btn"
            type="button"
            onMouseDown={onStartClick}
          >
            <NmxIconSvg symbol={NmxIconSvgSymbol.LOGO} size={48} />
          </button>
        </div>

        <div className="nmx-taskbar__apps">
          {apps.map((app) => (
            <TaskbarAppButton
              key={app.id}
              app={app}
              onAppClick={onAppClick}
              onAppDoubleClick={onAppDoubleClick}
            />
          ))}
        </div>

        <div className="nmx-taskbar__tray">
          <span className="nmx-taskbar__clock">{time}</span>
        </div>
      </div>
    </div>
  )
}
