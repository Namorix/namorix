import React from "react"
import { useWindowsStore } from "../../stores"
import type { WindowFrameProps } from "./WindowFrame.types"
import { useWindowDrag } from "./useWindowDrag"
import { useWindowResize } from "./useWindowResize"
import { useAddonMount } from "./useAddonMount"
import { WindowFrameView } from "./WindowFrameView"

export const WindowFrame: React.FC<WindowFrameProps> = ({ win }) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
  } = useWindowsStore()

  const { onTitleBarMouseDown } = useWindowDrag(win.id)
  const { onResizeStart } = useWindowResize(win.id)
  const { mountRef } = useAddonMount(win.id)

  return (
    <WindowFrameView
      win={win}
      mountRef={mountRef}
      onFocus={() => focusWindow(win.id)}
      onClose={() => closeWindow(win.id)}
      onMinimize={() => minimizeWindow(win.id)}
      onMaximize={() => maximizeWindow(win.id)}
      onRestore={() => restoreWindow(win.id)}
      onTitleBarMouseDown={onTitleBarMouseDown}
      onResizeStart={onResizeStart}
    />
  )
}
