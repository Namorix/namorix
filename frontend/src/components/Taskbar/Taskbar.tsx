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
import { useSignalRStatus } from "@namorix/core"

export const Taskbar: React.FC = () => {
  const dispatch = useAppDispatch()
  const order = useAppSelector(selectorTaskbarOrder)
  const activeId = useAppSelector(selectorActiveId)
  const signalStatus = useSignalRStatus()
  const { time, date } = useTaskbarClock()

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
      date={date}
      signalStatus={signalStatus}
      onStartClick={() => dispatch(toggleLauncher())}
      onAppClick={handleAppClick}
    />
  )
}

Taskbar.displayName = "Taskbar"
