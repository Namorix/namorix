import type { WindowData, WindowRect } from "../../../store"

export const useWindowOrigins = (
  win: WindowData | null | undefined,
  taskbarRect: WindowRect | null,
) => {
  const openOrigin = win?.originRect
    ? `${win.originRect.x + win.originRect.width / 2}px ${win.originRect.y + win.originRect.height / 2}px`
    : "center center"

  const minimizeOrigin = taskbarRect
    ? `${taskbarRect.x + taskbarRect.width / 2}px ${taskbarRect.y + taskbarRect.height / 2}px`
    : "center bottom"

  return { openOrigin, minimizeOrigin }
}
