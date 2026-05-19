import React, { useCallback } from "react"
import { useTaskbarClock } from "../../hooks"
import { TaskbarView } from "./TaskbarView"
import {
  focusWindow,
  minimizeWindow,
  selectorActiveId,
  selectorTaskbarOrder,
  store,
  toggleLauncher,
  useAppDispatch,
  useAppSelector,
} from "../../store"

export const Taskbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const order = useAppSelector(selectorTaskbarOrder)
  const activeId = useAppSelector(selectorActiveId)
  const time = useTaskbarClock()

  const handleAppClick = useCallback(
    (id: string) => {
      const state = store.getState()
      const win = state.windowsState.byId[id]

      if (win?.minimized) {
        dispatch(focusWindow(id))
      } else if (id === activeId) {
        dispatch(minimizeWindow(id))
      } else {
        dispatch(focusWindow(id))
      }
    },
    [activeId, dispatch],
  )

  return (
    <TaskbarView
      order={order}
      time={time}
      onStartClick={() => dispatch(toggleLauncher())}
      onAppClick={handleAppClick}
    />
  )
}

Taskbar.displayName = "Taskbar"
