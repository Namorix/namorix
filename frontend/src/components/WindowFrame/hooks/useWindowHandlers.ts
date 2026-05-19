import React, { useCallback, useRef } from "react"
import {
  closeWindow,
  focusWindow,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  resizeWindow,
  restoreWindow,
  savePreMaximize,
  setAnimState,
  useAppDispatch,
  type WindowData,
  type WindowId,
  type WindowRect,
} from "../../../store"
import { getWindowDefaults } from "../../../config"

export const useWindowHandlers = (
  winId: WindowId,
  win?: WindowData | null,
  frameRef?: React.RefObject<HTMLDivElement | null>,
) => {
  const dispatch = useAppDispatch()
  const restoreOriginRef = useRef<WindowRect | null>(null)

  const onAnimationEnd = useCallback(() => {
    if (!win) {
      return
    }

    switch (win.animState) {
      case "opening":
      case "restoring":
        dispatch(setAnimState({ id: winId, anim: "idle" }))
        break
      case "closing":
        dispatch(closeWindow(winId))
        break
      case "maximizing":
        dispatch(maximizeWindow(winId))
        dispatch(setAnimState({ id: winId, anim: "idle" }))
        break
      case "unmaximizing": {
        const origin = restoreOriginRef.current
        if (origin) {
          dispatch(moveWindow({ id: winId, x: origin.x, y: origin.y }))
          dispatch(
            resizeWindow({
              id: winId,
              width: origin.width,
              height: origin.height,
            }),
          )
        }
        dispatch(restoreWindow(winId))
        dispatch(setAnimState({ id: winId, anim: "idle" }))
        break
      }
      default:
        dispatch(minimizeWindow(winId))
        dispatch(setAnimState({ id: winId, anim: "idle" }))
    }
  }, [win, dispatch, winId])

  const onMaximize = useCallback(() => {
    if (!frameRef || !frameRef.current) {
      return
    }

    const rect = frameRef.current.getBoundingClientRect()
    dispatch(
      savePreMaximize({
        id: winId,
        rect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
      }),
    )
    dispatch(setAnimState({ id: winId, anim: "maximizing" }))
  }, [dispatch, frameRef, winId])

  const onRestore = useCallback(
    (clientX: number, clientY: number) => {
      const pre = win?.preMaximize
      if (!pre) {
        return
      }

      if (clientX === undefined || clientY === undefined) {
        const { taskbarHeight } = getWindowDefaults()
        const availableHeight = window.innerHeight - taskbarHeight - pre.y

        restoreOriginRef.current = {
          x: pre.x,
          y: pre.y,
          width: pre.width,
          height: Math.min(pre.height, availableHeight),
        }
      } else {
        const { titleBarCursorOffset, taskbarHeight } = getWindowDefaults()

        const ratioX = clientX / window.innerWidth
        const rawX = clientX - pre.width * ratioX
        const x = Math.max(0, Math.min(rawX, window.innerWidth - pre.width))

        const rawY = clientY - titleBarCursorOffset
        const y = Math.max(0, rawY)

        const availableHeight = window.innerHeight - taskbarHeight - y
        const height = Math.min(pre.height, availableHeight)

        restoreOriginRef.current = { x, y, height, width: pre.width }
      }
      dispatch(setAnimState({ id: winId, anim: "unmaximizing" }))
    },
    [win?.preMaximize, dispatch, winId],
  )

  const onFocus = useCallback(
    () => dispatch(focusWindow(winId)),
    [winId, dispatch],
  )

  const onClose = useCallback(
    () => dispatch(setAnimState({ id: winId, anim: "closing" })),
    [winId, dispatch],
  )

  const onMinimize = useCallback(
    () => dispatch(setAnimState({ id: winId, anim: "minimizing" })),
    [winId, dispatch],
  )

  return {
    onAnimationEnd,
    onMaximize,
    onFocus,
    onClose,
    onMinimize,
    onRestore,
  }
}
