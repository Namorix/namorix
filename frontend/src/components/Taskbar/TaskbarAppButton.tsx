import { memo, useEffect, useRef } from "react"
import { cx, NmxIconSvg } from "@namorix/ui"
import {
  removeAppRect,
  selectorTaskbarButtonData,
  setAppRect,
  useAppDispatch,
  useAppSelector,
  type WindowId,
} from "../../store"

interface TaskbarAppButtonProps {
  winId: WindowId
  onAppClick: (id: WindowId) => void
}

export const TaskbarAppButton = memo<TaskbarAppButtonProps>(
  ({ winId, onAppClick }) => {
    const dispatch = useAppDispatch()
    const btnRef = useRef<HTMLButtonElement>(null)
    const data = useAppSelector(selectorTaskbarButtonData(winId))

    useEffect(() => {
      const el = btnRef.current
      if (!el) {
        return
      }

      const updateRect = () => {
        const dom = el.getBoundingClientRect()
        dispatch(
          setAppRect({
            id: winId,
            rect: {
              x: dom.x,
              y: dom.y,
              width: dom.width,
              height: dom.height,
            },
          }),
        )
      }

      updateRect()
      const observer = new ResizeObserver(updateRect)
      observer.observe(el)

      return () => {
        observer.disconnect()
        dispatch(removeAppRect(winId))
      }
    }, [winId, dispatch])

    if (!data) {
      return null
    }

    return (
      <button
        ref={btnRef}
        className={cx("nmx-taskbar__app-btn", {
          "nmx-taskbar__app-btn--active": data.isActive,
        })}
        type="button"
        onMouseDown={() => onAppClick(data.id)}
      >
        {data.icon ? <NmxIconSvg symbol={data.icon} /> : data.title}
      </button>
    )
  },
)

TaskbarAppButton.displayName = "TaskbarAppButton"
