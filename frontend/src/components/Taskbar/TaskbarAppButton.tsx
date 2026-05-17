import React from "react"
import { cx } from "@namorix/ui"
import type { TaskbarApp } from "./Taskbar.types"

interface TaskbarAppButtonProps {
  app: TaskbarApp
  onAppClick: (id: string) => void
  onAppDoubleClick: (id: string) => void
}

export const TaskbarAppButton: React.FC<TaskbarAppButtonProps> = ({
  app,
  onAppClick,
  onAppDoubleClick,
}) => (
  <button
    className={cx("nmx-taskbar__app-btn", {
      "nmx-taskbar__app-btn--active": app.isActive,
    })}
    type="button"
    onMouseDown={() => onAppClick(app.id)}
    onDoubleClick={() => onAppDoubleClick(app.id)}
  >
    {app.title}
  </button>
)
