import { memo, useEffect, useRef } from "react"
import { cx, NmxIconSvg } from "@namorix/ui"
import type { TaskbarApp } from "./Taskbar.types"
import { useTaskbarRectStore } from "../WindowFrame/useTaskbarRectStore"
import { useShallow } from "zustand/react/shallow"

interface TaskbarAppButtonProps {
  app: TaskbarApp
  onAppClick: (id: string) => void
}

export const TaskbarAppButton = memo<TaskbarAppButtonProps>(
  ({ app, onAppClick }) => {
    const btnRef = useRef<HTMLButtonElement>(null)
    const { register, unregister } = useTaskbarRectStore(
      useShallow((state) => ({
        register: state.register,
        unregister: state.unregister,
      })),
    )

    useEffect(() => {
      register(app.id, () => btnRef.current?.getBoundingClientRect() ?? null)
      return () => unregister(app.id)
    }, [app.id, register, unregister])

    return (
      <button
        ref={btnRef}
        className={cx("nmx-taskbar__app-btn", {
          "nmx-taskbar__app-btn--active": app.isActive,
        })}
        type="button"
        onMouseDown={() => onAppClick(app.id)}
      >
        {app.icon ? <NmxIconSvg symbol={app.icon} /> : app.title}
      </button>
    )
  },
)

TaskbarAppButton.displayName = "TaskbarAppButton"
